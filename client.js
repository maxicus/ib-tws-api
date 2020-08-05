import EventEmitter from 'events';
import assert from 'assert';
import util from 'util';
const debuglog = util.debuglog('ib-tws-api');

import ProtocolBytes from './protocol-bytes.js';
import IncomeFieldsetHandler from './income-fieldset-handler.js';
import IncomeMessageType from './const-income-message-type.js';
import OutcomeMessageType from './const-outcome-message-type.js';
import RateLimiter from './rate-limiter.js';
import ServerVersion from './const-server-version.js';
import {
  request_mktData,
  request_tickByTickData,
  request_cancelTickByTickData
} from './requests/market-data.js';
import {
  request_placeOrder
} from './requests/order.js';



/* Protocol's fieldset-level handing */
class Client {
  /* connectionParameters: {
      host,
      port,
      clientId,
      timeoutMs
    }
  */
  constructor(connectionParameters = {}) {
    this._connectionParameters = connectionParameters;
    this._emitter = new EventEmitter();
    this._emitter.on('error', (e) => {
      // error handler to ignore it by default
    });

    this._connectionPromise = null;
    this._connected = false;
  }



  async connect(p) {
    if (p != null) {
      this._connectionParameters = p;
      console.error('ib-tws-api: deprecated use of Client.connect - please pass connection parameters to constructor instead');
    }

    await this._maybeConnect();
  }



  async _maybeConnect() {
    if (this._connected) {
      return;
    }

    if (this._connectionPromise == null) {
      this._connectionPromise = this._connect();
    }

    try {
      await this._connectionPromise;
      this._connected = true;
    } finally {
      this._connectionPromise = null;
    }
  }



  async _connect() {
    if (this._protocolBytes) {
      this._protocolBytes.removeAllListeners();   // allow gc to remove old
    }

    this._clientId = this._connectionParameters.clientId || 1;
    this._serverVersion = 0;

    // build protocol bytes object
    this._protocolBytes = new ProtocolBytes();

    const timeoutMs = this._connectionParameters.timeoutMs || 30000;
    this._rateLimiter = new RateLimiter((data) => {
      return this._protocolBytes.sendFieldset(data);
    }, 45, 1000, timeoutMs);

    this._protocolBytes.on('message_fieldset', (o) => {
      this._onMessageFieldset(o);
    });

    this._protocolBytes.on('close', (e) => {
      this._connected = false;
      this._emitter.emit('close');
    });

    this._protocolBytes.on('error', (e) => {
      this._emitter.emit('error', e);
    });

    await this._protocolBytes.connect({
      host: this._connectionParameters.host,
      port: this._connectionParameters.port,
      clientId: this._clientId
    });

    this._protocolBytes.sendHandshake();

    // attach messages handler
    this._incomeHandler = new IncomeFieldsetHandler({
      timeoutMs,
      eventEmitter: this._emitter
    });

    let serverVersion = await this._incomeHandler.awaitMessageType(
      IncomeMessageType._SERVER_VERSION);
    this._serverVersion = serverVersion;
    this._incomeHandler.setServerVersion(serverVersion);

    this._connectSendStartApi();
    let [nextValidId, accounts] = await Promise.all([
      this._incomeHandler.awaitMessageType(IncomeMessageType.NEXT_VALID_ID),
      this._incomeHandler.awaitMessageType(IncomeMessageType.MANAGED_ACCTS)
    ]);

    this._nextValidId = nextValidId;

    debuglog('connected ');
    debuglog({nextValidId: nextValidId, accounts: accounts});
  }



  _connectSendStartApi() {
    const START_API = 71;
    const VERSION = 2;
    const optCapab = '';

    this._protocolBytes.sendFieldset(
      [START_API, VERSION, this._clientId, optCapab]);
  }



  async _sendFieldsetRateLimited(fields) {
    await this._maybeConnect();
    this._rateLimiter.run(fields);
  }



  async _sendFieldsetExpirable(fields) {
    await this._maybeConnect();
    this._rateLimiter.runExpirable(fields);
  }



  _onMessageFieldset(fields) {
    if (!this._serverVersion) {
      this._incomeHandler.processMessageFieldsetBeforeServerVersion(fields);
    } else {
      this._incomeHandler.processMessageFieldset(fields);
    }
  }



  async _allocateRequestId() {
    await this._maybeConnect();
    return ++this._nextValidId;
  }



  async getCurrentTime() {
    /* Asks the current system time on the server side. */
    await this._sendFieldsetExpirable([
      OutcomeMessageType.REQ_CURRENT_TIME,
      1 /* VERSION */
    ]);

    return await this._incomeHandler.awaitMessageType(
      IncomeMessageType.CURRENT_TIME);
  }



  /*########################################################################
  ################## Market Data
  ##########################################################################*/

  /*
  Starts to stream market data
  see reqMktData for parameters
  */
  async streamMarketData(p) {
    assert(!p.requestId);
    assert(p.snapshot == null);
    assert(p.regulatorySnapshot == null);

    p.requestId = await this._allocateRequestId();
    p.genericTickList = p.genericTickList || '';
    p.snapshot = false;
    p.regulatorySnapshot = false;
    await this._sendFieldsetRateLimited(request_mktData(this._serverVersion, p));

    return this._incomeHandler.requestIdEmitter(p.requestId, () => {
      this._sendFieldsetRateLimited([
        OutcomeMessageType.CANCEL_MKT_DATA,
        2 /* VERSION */,
        p.requestId
      ]);
    });
  }



  /*
  Returns market data snapshot
  see reqMktData for parameters
  */
  async getMarketDataSnapshot(p) {
    assert(!p.requestId);
    assert(p.snapshot == null);

    p.requestId = await this._allocateRequestId();
    p.genericTickList = p.genericTickList || '';
    p.snapshot = true;
    p.regulatorySnapshot = p.regulatorySnapshot || false;
    await this._sendFieldsetExpirable(request_mktData(this._serverVersion, p));

    return await this._incomeHandler.awaitRequestId(p.requestId);
  }



  async reqMarketDataType(marketDataType) {
    /* The API can receive frozen market data from Trader
    Workstation. Frozen market data is the last data recorded in our system.
    During normal trading hours, the API receives real-time market data. If
    you use this function, you are telling TWS to automatically switch to
    frozen market data after the close. Then, before the opening of the next
    trading day, market data will automatically switch back to real-time
    market data.

    marketDataType:int - 1 for real-time streaming market data or 2 for
        frozen market data */

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_MARKET_DATA_TYPE) {
      throw new Error("It does not support market data type requests.");
    }

    await this._sendFieldsetRateLimited([
      OutcomeMessageType.REQ_MARKET_DATA_TYPE,
      1 /*VERSION */,
      marketDataType
    ]);
  }



  async reqSmartComponents(/*self, requestId: int, bboExchange: str*/) {
    throw new Error('not implemented yet');
    /*

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_SMART_COMPONENTS) {
        throw new Error(          "  It does not support smart components request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_SMART_COMPONENTS) \
        + flds.push(requestId) \
        + flds.push(bboExchange)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqMarketRule(/*self, marketRuleId: int*/) {
    throw new Error('not implemented yet');
    /*

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MARKET_RULES) {
        throw new Error(                         " It does not support market rule requests.")
        return

    msg = flds.push(OutcomeMessageType.REQ_MARKET_RULE) \
        + flds.push(marketRuleId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async streamTickByTickData(p) {
    /*
    contract: Contract,
    tickType: str,
    numberOfTicks: int,
    ignoreSize: bool
    */
    assert(!p.requestId);

    p.requestId = await this._allocateRequestId();
    await this._sendFieldsetRateLimited(request_tickByTickData(this._serverVersion, p));

    return this._incomeHandler.requestIdEmitter(p.requestId, () => {
      this._sendFieldsetRateLimited(
        request_cancelTickByTickData(this._serverVersion, p.requestId));
    });
  }



  /*
  ##########################################################################
  ################## Options
  ##########################################################################
  */

  async calculateImpliedVolatility(/*self, requestId:TickerId, contract:Contract,
                               optionPrice:float, underPrice:float,
                               implVolOptions:TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    """calculate volatility for a supplied
    option price and underlying price. Result will be delivered
    via EWrapper.tickOptionComputation()

    requestId:TickerId -  The request id.
    contract:Contract -  Describes the contract.
    optionPrice:double - The price of the option.
    underPrice:double - Price of the underlying."""


    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_CALC_IMPLIED_VOLAT) {
        throw new Error(
                "  It does not support calculateImpliedVolatility req.")
        return

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        if contract.tradingClass:
            throw new Error(
                    "  It does not support tradingClass parameter in calculateImpliedVolatility.")
            return

    const VERSION = 3;

    // send req mkt data msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_CALC_IMPLIED_VOLAT),
        flds.push(VERSION),
        flds.push(requestId),
        // send contract fields
        flds.push(contract.conId),
        flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.lastTradeDateOrContractMonth),
        flds.push(contract.strike),
        flds.push(contract.right),
        flds.push(contract.multiplier),
        flds.push(contract.exchange),
        flds.push(contract.primaryExchange),
        flds.push(contract.currency),
        flds.push(contract.localSymbol)]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.tradingClass),]
    flds += [ flds.push(optionPrice),
        flds.push(underPrice)]

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
        implVolOptStr = ""
        tagValuesCount = len(implVolOptions) if implVolOptions else 0
        if implVolOptions:
            for implVolOpt in implVolOptions:
                implVolOptStr += str(implVolOpt)
        flds += [flds.push(tagValuesCount),
            flds.push(implVolOptStr)]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelCalculateImpliedVolatility(/*self, requestId:TickerId*/) {
    throw new Error('not implemented yet');
    /*
    """cancel a request to calculate
    volatility for a supplied option price and underlying price.

    requestId:TickerId - The request ID.  """


    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_CALC_IMPLIED_VOLAT) {
        throw new Error(
                "  It does not support calculateImpliedVolatility req.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_CALC_IMPLIED_VOLAT) \
        + flds.push(VERSION) \
        + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }


  async calculateOptionPrice(/*self, requestId:TickerId, contract:Contract,
                         volatility:float, underPrice:float,
                         optPrcOptions:TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    """calculate option price and greek values
    for a supplied volatility and underlying price.

    requestId:TickerId -    The ticker ID.
    contract:Contract - Describes the contract.
    volatility:double - The volatility.
    underPrice:double - Price of the underlying."""


    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_CALC_IMPLIED_VOLAT) {
        throw new Error(
                "  It does not support calculateImpliedVolatility req.")
        return

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        if contract.tradingClass:
            throw new Error(
                    "  It does not support tradingClass parameter in calculateImpliedVolatility.")
            return

    const VERSION = 3;

    // send req mkt data msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_CALC_OPTION_PRICE),
        flds.push(VERSION),
        flds.push(requestId),
        // send contract fields
        flds.push(contract.conId),
        flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.lastTradeDateOrContractMonth),
        flds.push(contract.strike),
        flds.push(contract.right),
        flds.push(contract.multiplier),
        flds.push(contract.exchange),
        flds.push(contract.primaryExchange),
        flds.push(contract.currency),
        flds.push(contract.localSymbol)]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.tradingClass),]
    flds += [ flds.push(volatility),
        flds.push(underPrice)]

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
        optPrcOptStr = ""
        tagValuesCount = len(optPrcOptions) if optPrcOptions else 0
        if optPrcOptions:
            for implVolOpt in optPrcOptions:
                optPrcOptStr += str(implVolOpt)
        flds += [flds.push(tagValuesCount),
            flds.push(optPrcOptStr)]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelCalculateOptionPrice(/*self, requestId:TickerId*/) {
    throw new Error('not implemented yet');
    /*
    """cancel a request to calculate the option
    price and greek values for a supplied volatility and underlying price.

    requestId:TickerId - The request ID.  """


    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_CALC_IMPLIED_VOLAT) {
        throw new Error(
                "  It does not support calculateImpliedVolatility req.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_CALC_OPTION_PRICE) \
        + flds.push(VERSION) \
        + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async exerciseOptions(/*self, requestId:TickerId, contract:Contract,
                    exerciseAction:int, exerciseQuantity:int,
                    account:str, override:int*/) {
    throw new Error('not implemented yet');
    /*
    """requestId:TickerId - The ticker id. multipleust be a unique value.
    contract:Contract - This structure contains a description of the
        contract to be exercised
    exerciseAction:int - Specifies whether you want the option to lapse
        or be exercised.
        Values are 1 = exercise, 2 = lapse.
    exerciseQuantity:int - The quantity you want to exercise.
    account:str - destination account
    override:int - Specifies whether your setting will override the system's
        natural action. For example, if your action is "exercise" and the
        option is not in-the-money, by natural action the option would not
        exercise. If you have override set to "yes" the natural action would
         be overridden and the out-of-the money option would be exercised.
        Values are: 0 = no, 1 = yes."""


    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        if contract.tradingClass:
            throw new Error(
                    "  It does not support conId, multiplier, tradingClass parameter in exerciseOptions.")
            return

    const VERSION = 2;

    // send req mkt data msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.EXERCISE_OPTIONS),
        flds.push(VERSION),
        flds.push(requestId)]
    // send contract fields
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.conId),]
    flds += [flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.lastTradeDateOrContractMonth),
        flds.push(contract.strike),
        flds.push(contract.right),
        flds.push(contract.multiplier),
        flds.push(contract.exchange),
        flds.push(contract.currency),
        flds.push(contract.localSymbol)]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.tradingClass),]
    flds += [flds.push(exerciseAction),
        flds.push(exerciseQuantity),
        flds.push(account),
        flds.push(override)]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Orders
  ########################################################################
  */

  async placeOrder(p) {
    /*
    place an order. The order status will
    be returned by the orderStatus event.

    contract:Contract - This structure contains a description of the
        contract which is being traded.
    order:Order - This structure contains the details of tradedhe order.
        Note: Each client MUST connect with a unique clientId.*/
    assert(!p.orderId);

    p.orderId = await this._allocateRequestId();
    p.order.clientId = this._clientId;

    await this._sendFieldsetRateLimited(
      request_placeOrder(this._serverVersion, p));

    return p.orderId;
  }



  async cancelOrder(orderId) {
    /* cancel an order. */

    await this._sendFieldsetExpirable([
      OutcomeMessageType.CANCEL_ORDER,
      1 /* VERSION */,
      orderId
    ]);

    return await this._incomeHandler.awaitRequestIdErrorCode(orderId, 202);
  }



  async getOpenOrders() {
    /* request the open orders that were placed from this client.

    Note:  The client with a clientId of 0 will also receive the TWS-owned
    open orders. These orders will be associated with the client and a new
    orderId will be generated. This association will persist over multiple
    API and TWS sessions.  */

    await this._sendFieldsetExpirable([
      OutcomeMessageType.REQ_OPEN_ORDERS,
      1 /* VERSION */
    ]);

    return await this._incomeHandler.awaitMessageType(
      IncomeMessageType.OPEN_ORDER_END);
  }



  async reqAutoOpenOrders(bAutoBind) {
    /* request that newly created TWS orders
    be implicitly associated with the client. When a new TWS order is
    created, the order will be associated with the client.

    Note:  This request can only be made from a client with clientId of 0.

    bAutoBind: If set to TRUE, newly created TWS orders will be implicitly
    associated with the client. If set to FALSE, no association will be
    made.*/

    await this._sendFieldsetRateLimited([
      OutcomeMessageType.REQ_AUTO_OPEN_ORDERS,
      1 /* VERSION */,
      bAutoBind
    ]);
  }


  async getAllOpenOrders() {
    /* request the open orders placed from all
    clients and also from TWS.

    Note:  No association is made between the returned orders and the
    requesting client. */

    await this._sendFieldsetExpirable([
      OutcomeMessageType.REQ_ALL_OPEN_ORDERS,
      1 /* VERSION */
    ]);

    return await this._incomeHandler.awaitMessageType(
      IncomeMessageType.OPEN_ORDER_END);
  }



  async reqGlobalCancel() {
    /* Use this function to cancel all open orders globally. It
    cancels both API and TWS open orders.

    If the order was created in TWS, it also gets canceled. If the order
    was initiated in the API, it also gets canceled. */

    await this._sendFieldsetRateLimited([
      OutcomeMessageType.REQ_GLOBAL_CANCEL,
      1 /* VERSION */
    ]);
  }


  /*
  #########################################################################
  ################## Account and Portfolio
  ########################################################################
  */

  async reqAccountUpdates(p) {
    /* start getting account values, portfolio, and last update time information

    subscribe:bool - If set to TRUE, the client will start receiving account
        and Portfoliolio updates. If set to FALSE, the client will stop
        receiving this information.
    accountCode:str -The account code for which to receive account and
        portfolio updates.*/

    const VERSION = 2;

    await this._sendFieldsetRateLimited([
      OutcomeMessageType.REQ_ACCT_DATA,
      VERSION,
      p.subscribe,  // TRUE = subscribe, FALSE = unsubscribe.
      p.accountCode   // srv v9 and above, the account code. This will only be used for FA clients
    ]);
  }



  async reqAccountSummary(/*self, requestId:int, groupName:str, tags:str*/) {
    throw new Error('not implemented yet');
    /*
    """Call this method to request and keep up to date the data that appears
    on the TWS Account Window Summary tab. The data is returned by
    accountSummary().

    Note:   This request is designed for an FA managed account but can be
    used for any multi-account structure.

    requestId:int - The ID of the data request. Ensures that responses are matched
        to requests If several requests are in process.
    groupName:str - Set to All to returnrn account summary data for all
        accounts, or set to a specific Advisor Account Group name that has
        already been created in TWS Global Configuration.
    tags:str - A comma-separated list of account tags.  Available tags are:
        accountountType
        NetLiquidation,
        TotalCashValue - Total cash including futures pnl
        SettledCash - For cash accounts, this is the same as
        TotalCashValue
        AccruedCash - Net accrued interest
        BuyingPower - The maximum amount of marginable US stocks the
            account can buy
        EquityWithLoanValue - Cash + stocks + bonds + mutual funds
        PreviousDayEquityWithLoanValue,
        GrossPositionValue - The sum of the absolute value of all stock
            and equity option positions
        RegTEquity,
        RegTMargin,
        SMA - Special Memorandum Account
        InitMarginReq,
        MaintMarginReq,
        AvailableFunds,
        ExcessLiquidity,
        Cushion - Excess liquidity as a percentage of net liquidation value
        FullInitMarginReq,
        FullMaintMarginReq,
        FullAvailableFunds,
        FullExcessLiquidity,
        LookAheadNextChange - Time when look-ahead values take effect
        LookAheadInitMarginReq,
        LookAheadMaintMarginReq,
        LookAheadAvailableFunds,
        LookAheadExcessLiquidity,
        HighestSeverity - A measure of how close the account is to liquidation
        DayTradesRemaining - The Number of Open/Close trades a user
            could put on before Pattern Day Trading is detected. A value of "-1"
            means that the user can put on unlimited day trades.
        Leverage - GrossPositionValue / NetLiquidation
        $LEDGER - Single flag to relay all cash balance tags*, only in base
            currency.
        $LEDGER:CURRENCY - Single flag to relay all cash balance tags*, only in
            the specified currency.
        $LEDGER:ALL - Single flag to relay all cash balance tags* in all
        currencies."""



    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_ACCOUNT_SUMMARY) \
       + flds.push(VERSION)   \
       + flds.push(requestId)     \
       + flds.push(groupName) \
       + flds.push(tags)

    this._sendFieldsetRateLimited(msg)
    */
  }


  async cancelAccountSummary(/*self, requestId:int*/) {
    throw new Error('not implemented yet');
    /*
    """Cancels the request for Account Window Summary tab data.

    requestId:int - The ID of the data request being canceled."""



    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_ACCOUNT_SUMMARY) \
       + flds.push(VERSION)   \
       + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }


  async getPositions() {
    /* Returns real-time position data for all accounts. */
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_POSITIONS) {
      throw new Error("It does not support positions request.");
    }

    const VERSION = 1;

    await this._sendFieldsetExpirable([OutcomeMessageType.REQ_POSITIONS, VERSION]);
    return await this._incomeHandler.awaitMessageType(IncomeMessageType.POSITION_END);
  }



  async cancelPositions() {
    /* Cancels real-time position updates. */
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_POSITIONS) {
      throw new Error("It does not support positions request.");
    }

    const VERSION = 1;

    await this._sendFieldsetRateLimited([OutcomeMessageType.CANCEL_POSITIONS, VERSION]);
  }



  async reqPositionsMulti(/*self, requestId:int, account:str, modelCode:str*/) {
    throw new Error('not implemented yet');
    /*
    """Requests positions for account and/or model.
    Results are delivered via EWrapper.positionMulti() and
    EWrapper.positionMultiEnd() """



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
        throw new Error(              "  It does not support positions multi request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_POSITIONS_MULTI) \
       + flds.push(VERSION)   \
       + flds.push(requestId)     \
       + flds.push(account) \
       + flds.push(modelCode)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelPositionsMulti(/*self, requestId:int*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
        throw new Error(              "  It does not support cancel positions multi request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_POSITIONS_MULTI) \
       + flds.push(VERSION)   \
       + flds.push(requestId)     \

    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqAccountUpdatesMulti(/*self, requestId: int, account:str, modelCode:str,
                            ledgerAndNLV:bool*/) {
    throw new Error('not implemented yet');
    /*
    """Requests account updates for account and/or model."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
        throw new Error(              "  It does not support account updates multi request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_ACCOUNT_UPDATES_MULTI) \
       + flds.push(VERSION)   \
       + flds.push(requestId)     \
       + flds.push(account) \
       + flds.push(modelCode) \
       + flds.push(ledgerAndNLV)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelAccountUpdatesMulti(/*self, requestId:int*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MODELS_SUPPORT) {
        throw new Error(              "  It does not support cancel account updates multi request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_ACCOUNT_UPDATES_MULTI) \
       + flds.push(VERSION)   \
       + flds.push(requestId)     \

    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Daily PnL
  #########################################################################
  */

  async reqPnL(/*self, requestId: int, account: str, modelCode: str*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_PNL) {
        throw new Error(              "  It does not support PnL request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_PNL) \
        + flds.push(requestId) \
        + flds.push(account) \
        + flds.push(modelCode)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelPnL(/*self, requestId: int*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_PNL) {
        throw new Error(              "  It does not support PnL request.")
        return

    msg = flds.push(OutcomeMessageType.CANCEL_PNL) \
        + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }

  async reqPnLSingle(/*self, requestId: int, account: str, modelCode: str, conid: int*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_PNL) {
        throw new Error(                         "  It does not support PnL request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_PNL_SINGLE) \
        + flds.push(requestId) \
        + flds.push(account) \
        + flds.push(modelCode) \
        + flds.push(conid)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelPnLSingle(/*self, requestId: int*/) {
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_PNL) {
        throw new Error(                         "  It does not support PnL request.")
        return

    msg = flds.push(OutcomeMessageType.CANCEL_PNL_SINGLE) \
        + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Executions
  #########################################################################
  */

  async reqExecutions(/*self, requestId:int, execFilter:ExecutionFilter*/) {
    throw new Error('not implemented yet');
    /*
    """When this function is called, the execution reports that meet the
    filter criteria are downloaded to the client via the execDetails()
    function. To view executions beyond the past 24 hours, open the
    Trade Log in TWS and, while the Trade Log is displayed, request
    the executions again from the API.

    requestId:int - The ID of the data request. Ensures that responses are
        matched to requests if several requests are in process.
    execFilter:ExecutionFilter - This object contains attributes that
        describe the filter criteria used to determine which execution
        reports are returned.

    NOTE: Time format must be 'yyyymmdd-hh:mm:ss' Eg: '20030702-14:55'"""



    const VERSION = 3;

    // send req open orders msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_EXECUTIONS),
        flds.push(VERSION)]

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_EXECUTION_DATA_CHAIN) {
        flds += [flds.push(requestId),]

    // Send the execution rpt filter data (srv v9 and above)
    flds += [flds.push(execFilter.clientId),
        flds.push(execFilter.acctCode),
        flds.push(execFilter.time),
        flds.push(execFilter.symbol),
        flds.push(execFilter.secType),
        flds.push(execFilter.exchange),
        flds.push(execFilter.side)]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Contract Details
  #########################################################################
  */

  async getContractDetails(contract) {
    /* download all details for a particular
    underlying.

    contract:Contract - The summary description of the contract being looked
        up. */
    let requestId = await this._allocateRequestId();

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SEC_ID_TYPE) {
      if (contract.secIdType || contract.secId) {
        throw new Error("It does not support secIdType and secId parameters.");
      }
    }

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
      if (contract.tradingClass) {
        throw new Error("It does not support tradingClass parameter in reqContractDetails.");
      }
    }

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_LINKING) {
      if (contract.primaryExchange) {
        throw new Error("It does not support primaryExchange parameter in reqContractDetails.");
      }
    }

    // send req mkt data msg
    let flds = [
      OutcomeMessageType.REQ_CONTRACT_DATA,
      8 /* VERSION */
    ];

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_CONTRACT_DATA_CHAIN) {
      flds.push(requestId);
    }

    // send contract fields
    flds.push(contract.conId);   // srv v37 and above
    flds.push(contract.symbol);
    flds.push(contract.secType);
    flds.push(contract.lastTradeDateOrContractMonth);
    flds.push(contract.strike);
    flds.push(contract.right);
    flds.push(contract.multiplier);   // srv v15 and above

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_PRIMARYEXCH) {
      flds.push(contract.exchange);
      flds.push(contract.primaryExchange);
    } else if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
      if (contract.primaryExchange &&
          (contract.exchange == "BEST" || contract.exchange == "SMART")) {
        flds.push(contract.exchange + ":" + contract.primaryExchange);
      } else {
        flds.push(contract.exchange);
      }
    }

    flds.push(contract.currency);
    flds.push(contract.localSymbol);

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
      flds.push(contract.tradingClass);
    }

    flds.push(contract.includeExpired);   // srv v31 and above

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_SEC_ID_TYPE) {
      flds.push(contract.secIdType);
      flds.push(contract.secId);
    }

    await this._sendFieldsetExpirable(flds);
    return await this._incomeHandler.awaitRequestId(requestId);
  }


  /*
  #########################################################################
  ################## Market Depth
  #########################################################################
  */

  async reqMktDepthExchanges() {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_MKT_DEPTH_EXCHANGES) {
        throw new Error(                         "  It does not support market depth exchanges request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_MKT_DEPTH_EXCHANGES)

    this._sendFieldsetRateLimited(msg)
    */
  }

  async reqMktDepth(/*self, requestId:TickerId, contract:Contract,
                numRows:int, isSmartDepth:bool, mktDepthOptions:TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    """request market depth for a specific
    contract. The market depth will be returned by the updateMktDepth() and
    updateMktDepthL2() events.

    Requests the contract's market depth (order book). Note this request must be
    direct-routed to an exchange and not smart-routed. The number of simultaneous
    market depth requests allowed in an account is calculated based on a formula
    that looks at an accounts equity, commissions, and quote booster packs.

    requestId:TickerId - The ticker id. Must be a unique value. When the market
        depth data returns, it will be identified by this tag. This is
        also used when canceling the market depth
    contract:Contact - This structure contains a description of the contract
        for which market depth data is being requested.
    numRows:int - Specifies the numRowsumber of market depth rows to display.
    isSmartDepth:bool - specifies SMART depth request
    mktDepthOptions:TagValueList - For internal use only. Use default value
        XYZ."""

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        if contract.tradingClass || contract.conId > 0:
            throw new Error(
                "  It does not support conId and tradingClass parameters in reqMktDepth.")
            return

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SMART_DEPTH and isSmartDepth) {
        throw new Error(
            " It does not support SMART depth request.")
        return

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_MKT_DEPTH_PRIM_EXCHANGE an) { contract.primaryExchange:
        throw new Error(
            " It does not support primaryExchange parameter in reqMktDepth.")
        return

    const VERSION = 5;

    // send req mkt depth msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_MKT_DEPTH),
        flds.push(VERSION),
        flds.push(requestId)]

    // send contract fields
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.conId),]
    flds += [flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.lastTradeDateOrContractMonth),
        flds.push(contract.strike),
        flds.push(contract.right),
        flds.push(contract.multiplier),   // srv v15 and above
        flds.push(contract.exchange),]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_MKT_DEPTH_PRIM_EXCHANGE) {
        flds += [flds.push(contract.primaryExchange),]
    flds += [flds.push(contract.currency),
        flds.push(contract.localSymbol)]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.tradingClass),]

    flds += [flds.push(numRows),] # srv v19 and above

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_SMART_DEPTH) {
        flds += [flds.push(isSmartDepth),]

    // send mktDepthOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
        //current doc says this part if for "internal use only" -> won't support it
        if mktDepthOptions:
            raise NotImplementedError("not supported")
        mktDataOptionsStr = ""
        flds += [flds.push(mktDataOptionsStr),]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelMktDepth(/*self, requestId:TickerId, isSmartDepth:bool*/) {
    throw new Error('not implemented yet');
    /*
    """After calling this function, market depth data for the specified id
    will stop flowing.

    requestId:TickerId - The ID that was specified in the call to
        reqMktDepth().
    isSmartDepth:bool - specifies SMART depth request"""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SMART_DEPTH and isSmartDepth) {
        throw new Error(
            " It does not support SMART depth cancel.")
        return

    const VERSION = 1;

    // send cancel mkt depth msg
    let flds = []
    flds += [flds.push(OutcomeMessageType.CANCEL_MKT_DEPTH),
        flds.push(VERSION),
        flds.push(requestId)]

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_SMART_DEPTH) {
        flds += [flds.push(isSmartDepth)]

    msg = "".join(flds)

    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## News Bulletins
  #########################################################################
  */

  async reqNewsBulletins(/*self, allMsgs:bool*/) {
    throw new Error('not implemented yet');
    /*
    """start receiving news bulletins. Each bulletin
    will be returned by the updateNewsBulletin() event.

    allMsgs:bool - If set to TRUE, returns all the existing bulletins for
    the currencyent day and any new ones. If set to FALSE, will only
    return new bulletins. """



    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_NEWS_BULLETINS) \
        + flds.push(VERSION) \
        + flds.push(allMsgs)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelNewsBulletins() {
    throw new Error('not implemented yet');
    /*
    """stop receiving news bulletins."""

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_NEWS_BULLETINS) \
        + flds.push(VERSION)

    this._sendFieldsetRateLimited(msg)
    */
  }


  /*
  #########################################################################
  ################## Financial Advisors
  #########################################################################
  */

  async reqManagedAccts() {
    throw new Error('not implemented yet');
    /*
    """request the list of managed accounts. The list
    will be returned by the managedAccounts() function on the EWrapper.

    Note:  This request can only be made when connected to a FA managed account."""



    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_MANAGED_ACCTS) \
       + flds.push(VERSION)

    return this._sendFieldsetRateLimited(msg)
    */
  }



  async requestFA(/*self, faData:FaDataType*/) {
    throw new Error('not implemented yet');
    /*
    """request FA configuration information from TWS.
    The data returns in an XML string via a "receiveFA" ActiveX event.

    faData:FaDataType - Specifies the type of Financial Advisor
        configuration data beingingg requested. Valid values include:
        1 = GROUPS
        2 = PROFILE
        3 = ACCOUNT ALIASES"""



    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REQ_FA) \
       + flds.push(VERSION) \
       + flds.push(int(faData))

    return this._sendFieldsetRateLimited(msg)
    */
  }



  async replaceFA(/*self, faData:FaDataType , cxml:str*/) {
    throw new Error('not implemented yet');
    /*
    """modify FA configuration information from the
    API. Note that this can also be done manually in TWS itself.

    faData:FaDataType - Specifies the type of Financial Advisor
        configuration data beingingg requested. Valid values include:
        1 = GROUPS
        2 = PROFILE
        3 = ACCOUNT ALIASES
    cxml: str - The XML string containing the new FA configuration
        information.  """

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.REPLACE_FA) \
       + flds.push(VERSION) \
       + flds.push(int(faData)) \
       + flds.push(cxml) \

    return this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Historical Data
  #########################################################################
  */

  async getHistoricalData(p) {
    /*
    Requests contracts' historical data. When requesting historical data, a
    finishing time and date is required along with a duration string.

    requestId:TickerId - The id of the request. Must be a unique value. When the
        market data returns, it whatToShowill be identified by this tag. This is also
        used when canceling the market data.
    contract:Contract - This object contains a description of the contract for which
        market data is being requested.
    endDateTime:str - Defines a query end date and time at any point during the past 6 mos.
        Valid values include any date/time within the past six months in the format:
        yyyymmdd HH:mm:ss ttt

        where "ttt" is the optional time zone.
    duration:str - Set the query duration up to one week, using a time unit
        of seconds, days or weeks. Valid values include any integer followed by a space
        and then S (seconds), D (days) or W (week). If no unit is specified, seconds is used.
    barSizeSetting:str - Specifies the size of the bars that will be returned (within IB/TWS listimits).
        Valid values include:
        1 sec
        5 secs
        15 secs
        30 secs
        1 min
        2 mins
        3 mins
        5 mins
        15 mins
        30 mins
        1 hour
        1 day
    whatToShow:str - Determines the nature of data beinging extracted. Valid values include:
        TRADES
        MIDPOINT
        BID
        ASK
        BID_ASK
        HISTORICAL_VOLATILITY
        OPTION_IMPLIED_VOLATILITY
    useRth:int - Determines whether to return all data available during the requested time span,
        or only data that falls within regular trading hours. Valid values include:

        0 - all data is returned even where the market in question was outside of its
        regular trading hours.
        1 - only data within the regular trading hours is returned, even if the
        requested time span falls partially or completely outside of the RTH.
    formatDate: int - Determines the date format applied to returned bars. validd values include:

        1 - dates applying to bars returned in the format: yyyymmdd{space}{space}hh:mm:dd
        2 - dates are returned as a long integer specifying the number of seconds since
            1/1/1970 GMT.
    */
    assert(!p.requestId);

    let requestId = await this._allocateRequestId();
    let contract = p.contract;
    let endDateTime = p.endDateTime;
    let durationStr = p.duration;
    let barSizeSetting = p.barSizeSetting;
    let whatToShow = p.whatToShow;
    let useRth = p.useRth;
    let formatDate = p.formatDate;
    let keepUpToDate = p.keepUpToDate;
    let chartOptions = p.chartOptions;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
      if (contract.tradingClass || contract.conId > 0) {
        throw new Error("It does not support conId and tradingClass parameters in reqHistoricalData.");
      }
    }

    const VERSION = 6;

    // send req mkt data msg
    let flds = [OutcomeMessageType.REQ_HISTORICAL_DATA];

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SYNT_REALTIME_BARS) {
      flds.push(VERSION);
    }

    flds.push(requestId);

    // send contract fields
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
      flds.push(contract.conId);
    }

    flds.push(contract.symbol);
    flds.push(contract.secType);
    flds.push(contract.lastTradeDateOrContractMonth);
    flds.push(contract.strike);
    flds.push(contract.right);
    flds.push(contract.multiplier);
    flds.push(contract.exchange);
    flds.push(contract.primaryExchange);
    flds.push(contract.currency);
    flds.push(contract.localSymbol);

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
      flds.push(contract.tradingClass);
    }

    flds.push(contract.includeExpired);   // srv v31 and above
    flds.push(endDateTime);   // srv v20 and above
    flds.push(barSizeSetting);   // srv v20 and above
    flds.push(durationStr);
    flds.push(useRth);
    flds.push(whatToShow);
    flds.push(formatDate);   // srv v16 and above

    // Send combo legs for BAG requests
    if (contract.secType == "BAG") {
      flds.push(contract.comboLegs.length);

      contract.comboLegs.forEach((comboLeg) => {
        flds.push(comboLeg.conId);
        flds.push(comboLeg.ratio);
        flds.push(comboLeg.action);
        flds.push(comboLeg.exchange);
      });
    }

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_SYNT_REALTIME_BARS) {
      flds.push(keepUpToDate);
    }

    // send chartOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
      let chartOptionsStr = "";
      if (chartOptions) {
        chartOptions.forEach((tagValue) => {
          chartOptionsStr += tagValue;
        });
      }

      flds.push(chartOptionsStr);
    }

    await this._sendFieldsetExpirable(flds);
    return await this._incomeHandler.awaitRequestId(requestId);
  }



  async cancelHistoricalData(requestId) {
    /* Used if an internet disconnect has occurred or the results of a query
    are otherwise delayed and the application is no longer interested in receiving
    the data.

    requestId:TickerId - The ticker ID. Must be a unique value. */
    const VERSION = 1;

    await this._sendFieldsetRateLimited([
      OutcomeMessageType.CANCEL_HISTORICAL_DATA,
      VERSION,
      requestId
    ]);
  }



  async getHeadTimeStamp(p) {
    /*
    whatToShow: str, useRth: int, formatDate: int

    Note that formatData parameter affects intraday bars only
    1-day bars always return with date in YYYYMMDD format
    */
    let requestId = await this._allocateRequestId();

    let contract = p.contract;
    let whatToShow = p.whatToShow;
    let useRth = p.useRth;
    let formatDate = p.formatDate;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_HEAD_TIMESTAMP) {
      throw new Error("It does not support head time stamp requests.");
    }

    let flds = [
      OutcomeMessageType.REQ_HEAD_TIMESTAMP,
      requestId,
      contract.conId,
      contract.symbol,
      contract.secType,
      contract.lastTradeDateOrContractMonth,
      contract.strike,
      contract.right,
      contract.multiplier,
      contract.exchange,
      contract.primaryExchange,
      contract.currency,
      contract.localSymbol,
      contract.tradingClass,
      contract.includeExpired,
      useRth,
      whatToShow,
      formatDate
    ];

    await this._sendFieldsetExpirable(flds);
    return await this._incomeHandler.awaitRequestId(requestId);
  }



  async cancelHeadTimeStamp(requestId) {
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_CANCEL_HEADTIMESTAMP) {
      throw new Error("It does not support head time stamp requests.");
    }

    await this._sendFieldsetRateLimited([OutcomeMessageType.CANCEL_HEAD_TIMESTAMP, requestId]);
  }



  async getHistogramData(p) {
    /*
    contract: Contract,
    useRth: bool,
    timePeriod: str */

    let requestId = await this._allocateRequestId();
    let contract = p.contract;
    let useRth = p.useRth;
    let timePeriod = p.timePeriod;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_HISTOGRAM) {
      throw new Error("It does not support histogram requests.");
    }

    await this._sendFieldsetExpirable([
      OutcomeMessageType.REQ_HISTOGRAM_DATA,
      requestId,
      contract.conId,
      contract.symbol,
      contract.secType,
      contract.lastTradeDateOrContractMonth,
      contract.strike,
      contract.right,
      contract.multiplier,
      contract.exchange,
      contract.primaryExchange,
      contract.currency,
      contract.localSymbol,
      contract.tradingClass,
      contract.includeExpired,
      useRth,
      timePeriod
    ]);

    return await this._incomeHandler.awaitRequestId(requestId);
  }



  async cancelHistogramData(requestId) {
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_HISTOGRAM) {
      throw new Error("It does not support histogram requests.");
    }

    await this._sendFieldsetRateLimited([OutcomeMessageType.CANCEL_HISTOGRAM_DATA, requestId]);
  }



  async getHistoricalTicks(p) {
    /*
    contract: Contract,
    startDateTime: str,
    endDateTime: str,
    numberOfTicks: int,
    whatToShow: str,
    useRth: int,
    ignoreSize: bool,
    miscOptions: TagValueList
    */
    let requestId = await this._allocateRequestId();
    let contract = p.contract;
    let startDateTime = p.startDateTime;
    let endDateTime = p.endDateTime;
    let numberOfTicks = p.numberOfTicks;
    let whatToShow = p.whatToShow;
    let useRth = p.useRth;
    let ignoreSize = p.ignoreSize;
    let miscOptions = p.miscOptions;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_HISTORICAL_TICKS) {
      throw new Error("It does not support historical ticks requests.");
    }

    let flds = [
      OutcomeMessageType.REQ_HISTORICAL_TICKS,
      requestId,
      contract.conId,
      contract.symbol,
      contract.secType,
      contract.lastTradeDateOrContractMonth,
      contract.strike,
      contract.right,
      contract.multiplier,
      contract.exchange,
      contract.primaryExchange,
      contract.currency,
      contract.localSymbol,
      contract.tradingClass,
      contract.includeExpired,
      p.startDateTime,
      p.endDateTime,
      p.numberOfTicks,
      p.whatToShow,
      p.useRth,
      p.ignoreSize
    ];

    let miscOptionsString = "";
    if (p.miscOptions) {
      miscOptions.forEach((tagValue) => {
        miscOptionsString += tagValue;
      });
    }

    flds.push(miscOptionsString);

    await this._sendFieldsetExpirable(flds);
    return await this._incomeHandler.awaitRequestId(requestId);
  }



  /*
  #########################################################################
  ################## Market Scanners
  #########################################################################
  */

  async reqScannerParameters() {
    /* Requests an XML string that describes all possible scanner queries. */
    const VERSION = 1;

    await this._sendFieldsetRateLimited([OutcomeMessageType.REQ_SCANNER_PARAMETERS, VERSION]);
    return await this._incomeHandler.awaitMessageType(IncomeMessageType.SCANNER_PARAMETERS);
  }



  async reqScannerSubscription(p) {
    /* requestId:int - The ticker ID. Must be a unique value.
    scannerSubscription:ScannerSubscription - This structure contains
        possible parameters used to filter results.
    scannerSubscriptionOptions:TagValueList - For internal use only.
        Use default value XYZ.

        requestId:int,
        subscription:ScannerSubscription,
        scannerSubscriptionOptions:TagValueList,
        scannerSubscriptionFilterOptions:TagValueList
    */



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SCANNER_GENERIC_OPTS &&
          cannerSubscriptionFilterOptions != null) {
      throw new Error("It does not support API scanner subscription generic filter options")
    }

    const VERSION = 4;

    let flds = [
      OutcomeMessageType.REQ_SCANNER_SUBSCRIPTION
    ];

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SCANNER_GENERIC_OPTS) {
      flds.push(VERSION);
    }

    flds.push(requestId);
    flds.push(subscription.numberOfRows);
    flds.push(subscription.instrument);
    flds.push(subscription.locationCode);
    flds.push(subscription.scanCode);
    flds.push(subscription.abovePrice);
    flds.push(subscription.belowPrice);
    flds.push(subscription.aboveVolume);
    flds.push(subscription.marketCapAbove);
    flds.push(subscription.marketCapBelow);
    flds.push(subscription.moodyRatingAbove);
    flds.push(subscription.moodyRatingBelow);
    flds.push(subscription.spRatingAbove);
    flds.push(subscription.spRatingBelow);
    flds.push(subscription.maturityDateAbove);
    flds.push(subscription.maturityDateBelow);
    flds.push(subscription.couponRateAbove);
    flds.push(subscription.couponRateBelow);
    flds.push(subscription.excludeConvertible);
    flds.push(subscription.averageOptionVolumeAbove);   // srv v25 and above
    flds.push(subscription.scannerSettingPairs);   // srv v25 and above
    flds.push(subscription.stockTypeFilter);   // srv v27 and above

    // send scannerSubscriptionFilterOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_SCANNER_GENERIC_OPTS) {
      if (scannerSubscriptionFilterOptions) {
        let scannerSubscriptionFilterOptionsStr = scannerSubscriptionFilterOptions.join('');
        flds.push(scannerSubscriptionFilterOptionsStr);
      }
    }

    // send scannerSubscriptionOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
      if (scannerSubscriptionOptions) {
        let scannerSubscriptionOptionsStr = scannerSubscriptionOptions.join('');
        flds.push(scannerSubscriptionOptionsStr);
      }
    }

    await this._sendFieldsetExpirable(flds);
    return await this._incomeHandler.awaitRequestId(requestId);
  }



  async cancelScannerSubscription(requestId) {
    /* requestId:int - The ticker ID. Must be a unique value. */
    const VERSION = 1;

    await this._sendFieldsetRateLimited([OutcomeMessageType.CANCEL_SCANNER_SUBSCRIPTION, VERSION, requestId]);
  }



  /*
  #########################################################################
  ################## Real Time Bars
  #########################################################################
  */

  async reqRealTimeBars(/*self, requestId:TickerId, contract:Contract, barSize:int,
                    whatToShow:str, useRth:bool,
                    realTimeBarsOptions:TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    """Call the reqRealTimeBars() function to start receiving real time bar
    results through the realtimeBar() EWrapper function.

    requestId:TickerId - The Id for the request. Must be a unique value. When the
        data is received, it will be identified by this Id. This is also
        used when canceling the request.
    contract:Contract - This object contains a description of the contract
        for which real time bars are being requested
    barSize:int - Currently only 5 second bars are supported, if any other
        value is used, an exception will be thrown.
    whatToShow:str - Determines the nature of the data extracted. Valid
        values include:
        TRADES
        BID
        ASK
        MIDPOINT
    useRth:bool - Regular Trading Hours only. Valid values include:
        0 = all data available during the time span requested is returned,
            including time intervals when the market in question was
            outside of regular trading hours.
        1 = only data within the regular trading hours for the product
            requested is returned, even if the time time span falls
            partially or completely outside.
    realTimeBarOptions:TagValueList - For internal use only. Use default value XYZ."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        if contract.tradingClass:
            throw new Error( requestId, UPDATE_TWS.code(),
                "It does not support conId and tradingClass parameter in reqRealTimeBars.")
            return

    const VERSION = 3;

    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_REAL_TIME_BARS),
        flds.push(VERSION),
        flds.push(requestId)]

    // send contract fields
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.conId),]
    flds += [flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.lastTradeDateOrContractMonth),
        flds.push(contract.strike),
        flds.push(contract.right),
        flds.push(contract.multiplier),
        flds.push(contract.exchange),
        flds.push(contract.primaryExchange),
        flds.push(contract.currency),
        flds.push(contract.localSymbol)]
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.tradingClass),]
    flds += [flds.push(barSize),
        flds.push(whatToShow),
        flds.push(useRth)]

    // send realTimeBarsOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
        realTimeBarsOptionsStr = ""
        if realTimeBarsOptions:
            for tagValueOpt in realTimeBarsOptions:
                realTimeBarsOptionsStr += str(tagValueOpt)
        flds += [flds.push(realTimeBarsOptionsStr),]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelRealTimeBars(requestId) {
    /*
    Call the cancelRealTimeBars() function to stop receiving real time bar results.
    requestId:TickerId - The Id that was specified in the call to reqRealTimeBars(). */
    const VERSION = 1;

    // send req mkt data msg
    await this._sendFieldsetRateLimited([OutcomeMessageType.CANCEL_REAL_TIME_BARS, VERSION, requestId]);
  }



  /*
  #########################################################################
  ################## Fundamental Data
  #########################################################################
  */

  async reqFundamentalData(/*self, requestId:TickerId , contract:Contract,
                       reportType:str, fundamentalDataOptions:TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    """receive fundamental data for
    stocks. The appropriate market data subscription must be set up in
    Account Management before you can receive this data.
    Fundamental data will be returned at EWrapper.fundamentalData().

    reqFundamentalData() can handle conid specified in the Contract object,
    but not tradingClass or multiplier. This is because reqFundamentalData()
    is used only for stocks and stocks do not have a multiplier and
    trading class.

    requestId:tickerId - The ID of the data request. Ensures that responses are
         matched to requests if several requests are in process.
    contract:Contract - This structure contains a description of the
        contract for which fundamental data is being requested.
    reportType:str - One of the following XML reports:
        ReportSnapshot (company overview)
        ReportsFinSummary (financial summary)
        ReportRatios (financial ratios)
        ReportsFinStatements (financial statements)
        RESC (analyst estimates)
        CalendarReport (company calendar) """



    const VERSION = 2;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_FUNDAMENTAL_DATA) {
        throw new Error(          "  It does not support fundamental data request.")
        return

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        throw new Error(          "  It does not support conId parameter in reqFundamentalData.")
        return

    let flds = []
    flds += [flds.push(OutcomeMessageType.REQ_FUNDAMENTAL_DATA),
        flds.push(VERSION),
        flds.push(requestId)]

    // send contract fields
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
        flds += [flds.push(contract.conId),]
    flds += [flds.push(contract.symbol),
        flds.push(contract.secType),
        flds.push(contract.exchange),
        flds.push(contract.primaryExchange),
        flds.push(contract.currency),
        flds.push(contract.localSymbol),
        flds.push(reportType)]

    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
        fundDataOptStr = ""
        tagValuesCount = len(fundamentalDataOptions) if fundamentalDataOptions else 0
        if fundamentalDataOptions:
            for fundDataOption in fundamentalDataOptions:
                fundDataOptStr += str(fundDataOption)
        flds += [flds.push(tagValuesCount),
            flds.push(fundDataOptStr)]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async cancelFundamentalData(requestId) {
    throw new Error('not implemented yet');
    /*
    """stop receiving fundamental data.

    requestId:TickerId - The ID of the data request."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_FUNDAMENTAL_DATA) {
        throw new Error(              "  It does not support fundamental data request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.CANCEL_FUNDAMENTAL_DATA) \
       + flds.push(VERSION)   \
       + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  ########################################################################
  ################## News
  #########################################################################
  */

  async reqNewsProviders() {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_NEWS_PROVIDERS) {
        throw new Error(                 "  It does not support news providers request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_NEWS_PROVIDERS)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqNewsArticle(/*self, requestId: int, providerCode: str, articleId: str, newsArticleOptions: TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_NEWS_ARTICLE) {
        throw new Error(                 "  It does not support news article request.")
        return

    let flds = []

    flds += [flds.push(OutcomeMessageType.REQ_NEWS_ARTICLE),
             flds.push(requestId),
             flds.push(providerCode),
             flds.push(articleId)]

    // send newsArticleOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_NEWS_QUERY_ORIGINS) {
        newsArticleOptionsStr = ""
        if newsArticleOptions:
            for tagValue in newsArticleOptions:
                newsArticleOptionsStr += str(tagValue)
        flds += [flds.push(newsArticleOptionsStr),]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqHistoricalNews(/*self, requestId: int, conId: int, providerCodes: str,
                  startDateTime: str, endDateTime: str, totalResults: int, historicalNewsOptions: TagValueList*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_HISTORICAL_NEWS) {
        throw new Error(                 "  It does not support historical news request.")
        return

    let flds = []

    flds += [flds.push(OutcomeMessageType.REQ_HISTORICAL_NEWS),
             flds.push(requestId),
             flds.push(conId),
             flds.push(providerCodes),
             flds.push(startDateTime),
             flds.push(endDateTime),
             flds.push(totalResults)]

    // send historicalNewsOptions parameter
    if (this._serverVersion >= ServerVersion.MIN_SERVER_VER_NEWS_QUERY_ORIGINS) {
        historicalNewsOptionsStr = ""
        if historicalNewsOptions:
            for tagValue in historicalNewsOptionsStr:
                historicalNewsOptionsStr += str(tagValue)
        flds += [flds.push(historicalNewsOptionsStr),]

    msg = "".join(flds)
    this._sendFieldsetRateLimited(msg)
    */
  }



  /*
  #########################################################################
  ################## Display Groups
  #########################################################################
  */

  async queryDisplayGroups(/*self, requestId: int*/) {
    throw new Error('not implemented yet');
    /*
    """API requests used to integrate with TWS color-grouped windows (display groups).
    TWS color-grouped windows are identified by an integer number. Currently that number ranges from 1 to 7 and are mapped to specific colors, as indicated in TWS.

    requestId:int - The unique number that will be associated with the
        response """



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_LINKING) {
        throw new Error(              "  It does not support queryDisplayGroups request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.QUERY_DISPLAY_GROUPS) \
       + flds.push(VERSION)   \
       + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async subscribeToGroupEvents(/*self, requestId:int, groupId:int*/) {
    throw new Error('not implemented yet');
    /*
    """requestId:int - The unique number associated with the notification.
    groupId:int - The ID of the group, currently it is a number from 1 to 7.
        This is the display group subscription request sent by the API to TWS."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_LINKING) {
        throw new Error(              "  It does not support subscribeToGroupEvents request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.SUBSCRIBE_TO_GROUP_EVENTS) \
       + flds.push(VERSION)   \
       + flds.push(requestId) \
       + flds.push(groupId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async updateDisplayGroup(/*self, requestId:int, contractInfo:str*/) {
    throw new Error('not implemented yet');
    /*
    """requestId:int - The requestId specified in subscribeToGroupEvents().
    contractInfo:str - The encoded value that uniquely represents the
        contract in IB. Possible values include:

        none = empty selection
        contractID@exchange - any non-combination contract.
            Examples: 8314@SMART for IBM SMART; 8314@ARCA for IBM @ARCA.
        combo = if any combo is selected."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_LINKING) {
        throw new Error(              "  It does not support updateDisplayGroup request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.UPDATE_DISPLAY_GROUP) \
       + flds.push(VERSION)   \
       + flds.push(requestId) \
       + flds.push(contractInfo)

    this._sendFieldsetRateLimited(msg)
    */
  }


  async unsubscribeFromGroupEvents(/*self, requestId:int*/) {
    throw new Error('not implemented yet');
    /*
    """requestId:int - The requestId specified in subscribeToGroupEvents()."""



    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_LINKING) {
        throw new Error(              "  It does not support unsubscribeFromGroupEvents request.")
        return

    const VERSION = 1;

    msg = flds.push(OutcomeMessageType.UNSUBSCRIBE_FROM_GROUP_EVENTS) \
       + flds.push(VERSION)   \
       + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async getSecDefOptParams(p) {
    /* Requests security definition option parameters for viewing a
    contract's option chain requestId the ID chosen for the request
    underlyingSymbol futFopExchange The exchange on which the returned
    options are trading. Can be set to the empty string "" for all
    exchanges. underlyingSecType The type of the underlying security,
    i.e. STK underlyingConId the contract ID of the underlying security.

    contract:
    futFopExchange:str,
    exchange: client-side filter of exchange of option's,
      since futFopExchange returns empty result when specified)
    */
    assert(!p.requestId);

    let requestId = await this._allocateRequestId();
    let underlyingSymbol = p.contract.symbol;
    let futFopExchange = p.futFopExchange;
    let underlyingSecType = p.contract.secType;
    let underlyingConId = p.contract.conId;

    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_SEC_DEF_OPT_PARAMS_REQ) {
      throw new Error("It does not support security definition option request.");
    }

    await this._sendFieldsetExpirable([OutcomeMessageType.REQ_SEC_DEF_OPT_PARAMS,
      requestId,
      underlyingSymbol,
      futFopExchange,
      underlyingSecType,
      underlyingConId
    ]);

    let result = await this._incomeHandler.awaitRequestId(requestId);
    if (!p.exchange) {
      return result;
    }

    // client-side filter
    for (let n = 0; n < result.length; n++) {
      if (result[n].exchange == p.exchange) {
        return result[n];
      }
    }

    return [];
  }



  async reqSoftDollarTiers(/*self, requestId:int*/) {
    throw new Error('not implemented yet');
    /*
    """Requests pre-defined Soft Dollar Tiers. This is only supported for
    registered professional advisors and hedge and mutual funds who have
    configured Soft Dollar Tiers in Account Management."""



    msg = flds.push(OutcomeMessageType.REQ_SOFT_DOLLAR_TIERS) \
       + flds.push(requestId)

    this._sendFieldsetRateLimited(msg)
    */
  }


  async reqFamilyCodes() {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_FAMILY_CODES) {
        throw new Error(              "  It does not support family codes request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_FAMILY_CODES)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqMatchingSymbols(/*self, requestId:int, pattern:str*/) {
    throw new Error('not implemented yet');
    /*
    if (this._serverVersion < ServerVersion.MIN_SERVER_VER_REQ_MATCHING_SYMBOLS) {
        throw new Error(              "  It does not support matching symbols request.")
        return

    msg = flds.push(OutcomeMessageType.REQ_MATCHING_SYMBOLS) \
       + flds.push(requestId)   \
       + flds.push(pattern)

    this._sendFieldsetRateLimited(msg)
    */
  }



  async reqCompletedOrders(p) {
    throw new Error('not implemented yet');
    /*
    apiOnly:bool

    """request the completed orders. If apiOnly parameter
    is true, then only completed orders placed from API are requested.
    Each completed order will be fed back through the
    completedOrder() function on the EWrapper."""

    msg = flds.push(OutcomeMessageType.REQ_COMPLETED_ORDERS) \
        + flds.push(apiOnly)

    this._sendFieldsetRateLimited(msg)
    */
  }
}



export default Client;
