import IncomeMessageType from '../constants/income-message-type';
import ServerVersion from '../constants/server-version';
import { IncomeFieldsetHandlerBus } from '../utils/income-fieldset-handler-bus';
import {
  handler_MARKET_DATA_TYPE,
  handler_TICK_BY_TICK,
  handler_TICK_GENERIC,
  handler_TICK_PRICE,
  handler_TICK_REQ_PARAMS,
  handler_TICK_OPTION_COMPUTATION,
  handler_TICK_SIZE,
  handler_TICK_SNAPSHOT_END,
  handler_TICK_STRING,
  handler_OPEN_ORDER,
  handler_COMPLETED_ORDER
} from './market-data';


//
// helper functions
//

function noop(name: string) { return (fields: any[]) => { return; }; }

//
// handlers of specific message types.
// called in a context of IncomeFieldsetHandlerBus
//

export default {
  [IncomeMessageType.TICK_PRICE]: handler_TICK_PRICE,
  [IncomeMessageType.TICK_SIZE]: handler_TICK_SIZE,



  [IncomeMessageType.ORDER_STATUS](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const orderId = parseInt(fields.shift() as string);
    const status = fields.shift();

    const filled = parseFloat(fields.shift() as string);
    const remaining = parseFloat(fields.shift() as string);
    const avgFillPrice = parseFloat(fields.shift() as string);

    const permId = parseInt(fields.shift() as string);   // ver 2 field
    const parentId = parseInt(fields.shift() as string);   // ver 3 field
    const lastFillPrice = parseFloat(fields.shift() as string);   // ver 4 field
    const clientId = parseInt(fields.shift() as string);   // ver 5 field
    const whyHeld = fields.shift();   // ver 6 field

    let marketCapPrice = null;
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_MARKET_CAP_PRICE) {
      marketCapPrice = parseFloat(fields.shift() as string);
    }

    this.emit('orderStatus', {
      orderId,
      status,
      filled,
      remaining,
      avgFillPrice,
      permId,
      parentId,
      lastFillPrice,
      clientId,
      whyHeld,
      marketCapPrice
    });
  },





  [IncomeMessageType.ERR_MSG](this: IncomeFieldsetHandlerBus, fields: any[]) {
    const requestId = fields[2];

    if (requestId > 0) {
      this.requestIdEmit(requestId, 'error', {
        code: fields[3],
        message: fields[4]
      });
    } else {
      this.emit('error', {
        code: fields[3],
        message: fields[4]
      });
    }
  },



  [IncomeMessageType.OPEN_ORDER]: handler_OPEN_ORDER,



  // HandleInfo(wrap=EWrapper.updateAccountValue),
  [IncomeMessageType.ACCT_VALUE]: noop('ACCT_VALUE'),
  // HandleInfo(proc=processPortfolioValueMsg),
  [IncomeMessageType.PORTFOLIO_VALUE]: noop('PORTFOLIO_VALUE'),
  // HandleInfo(wrap=EWrapper.updateAccountTime),
  [IncomeMessageType.ACCT_UPDATE_TIME]: noop('ACCT_UPDATE_TIME'),



  [IncomeMessageType.NEXT_VALID_ID](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.NEXT_VALID_ID, parseInt(fields[2]));
  },



  [IncomeMessageType.CONTRACT_DATA](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const version = parseInt(fields.shift());

    let requestId = -1;
    if (version >= 3) {
      requestId = parseInt(fields.shift());
    }

    const contract: any = {
      contract: {}
    };

    contract.contract.symbol = fields.shift();
    contract.contract.secType = fields.shift();

    const lastTradeDateOrContractMonth = fields.shift();
    if (lastTradeDateOrContractMonth.length > 0) {
      const splitted = lastTradeDateOrContractMonth.split(' ');
      if (splitted.length > 0) {
        contract.contract.lastTradeDateOrContractMonth = splitted[0];
      }

      if (splitted.length > 1) {
        contract.lastTradeTime = splitted[1];
      }
    }

    contract.contract.strike = parseFloat(fields.shift());
    contract.contract.right = fields.shift();
    contract.contract.exchange = fields.shift();
    contract.contract.currency = fields.shift();
    contract.contract.localSymbol = fields.shift();
    contract.marketName = fields.shift();
    contract.contract.tradingClass = fields.shift();
    contract.contract.conId = parseInt(fields.shift());
    contract.minTick = parseFloat(fields.shift());
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_MD_SIZE_MULTIPLIER) {
      contract.mdSizeMultiplier = parseInt(fields.shift());
    }
    contract.contract.multiplier = fields.shift();
    contract.orderTypes = fields.shift();
    contract.validExchanges = fields.shift();
    contract.priceMagnifier = parseInt(fields.shift());   // ver 2 field
    if (version >= 4) {
      contract.underConId = parseInt(fields.shift());
    }
    if (version >= 5) {
      contract.longName = fields.shift();
      contract.contract.primaryExchange = fields.shift();
    }
    if (version >= 6) {
      contract.contractMonth = fields.shift();
      contract.industry = fields.shift();
      contract.category = fields.shift();
      contract.subcategory = fields.shift();
      contract.timeZoneId = fields.shift();
      contract.tradingHours = fields.shift();
      contract.liquidHours = fields.shift();
    }
    if (version >= 8) {
      contract.evRule = fields.shift();
      contract.evMultiplier = parseInt(fields.shift());
    }
    if (version >= 7) {
      const secIdListCount = parseInt(fields.shift());
      if (secIdListCount > 0) {
        contract.secIdList = [];
        for (let n = 0; n < secIdListCount; n++) {
          const tagValue: any = {};
          tagValue.tag = fields.shift();
          tagValue.value = fields.shift();
          contract.secIdList.push(tagValue);
        }
      }
    }

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_AGG_GROUP) {
      contract.aggGroup = parseInt(fields.shift());
    }

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_UNDERLYING_INFO) {
      contract.underSymbol = fields.shift();
      contract.underSecType = fields.shift();
    }

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_MARKET_RULES) {
      contract.marketRuleIds = fields.shift();
    }

    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_REAL_EXPIRATION_DATE) {
      contract.realExpirationDate = fields.shift();
    }

    const storage = this.requestIdStorageArray(requestId);
    storage.push(contract);
  },



  // HandleInfo(proc=processExecutionDataMsg),
  [IncomeMessageType.EXECUTION_DATA]: noop('EXECUTION_DATA'),
  // HandleInfo(wrap=EWrapper.updateMktDepth),
  [IncomeMessageType.MARKET_DEPTH]: noop('MARKET_DEPTH'),
  // HandleInfo(proc=processMarketDepthL2Msg),
  [IncomeMessageType.MARKET_DEPTH_L2]: noop('MARKET_DEPTH_L2'),
  // HandleInfo(wrap=EWrapper.updateNewsBulletin),
  [IncomeMessageType.NEWS_BULLETINS]: noop('NEWS_BULLETINS'),



  [IncomeMessageType.MANAGED_ACCTS](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.MANAGED_ACCTS, fields[2].split(','));
  },

  // HandleInfo(wrap=EWrapper.receiveFA),
  [IncomeMessageType.RECEIVE_FA]: noop('RECEIVE_FA'),

  [IncomeMessageType.HISTORICAL_DATA](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();

    if (this.serverVersion < ServerVersion.MIN_SERVER_VER_SYNT_REALTIME_BARS) {
      parseInt(fields.shift());
    }

    const requestId = parseInt(fields.shift());
    const startDateStr = fields.shift();   // ver 2 field
    const endDateStr = fields.shift();   // ver 2 field

    const itemCount = parseInt(fields.shift());
    const bars = [];

    for (let n = 0; n < itemCount; n++) {
      const bar: any = {
        date: fields.shift(),
        open: parseFloat(fields.shift()),
        high: parseFloat(fields.shift()),
        low: parseFloat(fields.shift()),
        close: parseFloat(fields.shift()),
        volume: parseInt(fields.shift()),
        average: parseFloat(fields.shift())
      };

      if (this.serverVersion < ServerVersion.MIN_SERVER_VER_SYNT_REALTIME_BARS) {
        fields.shift();
      }

      bar.barCount = parseInt(fields.shift());   // ver 3 field
      bars.push(bar);
    }

    this.requestIdResolve(requestId, {
      dateStart: startDateStr,
      dateEnd: endDateStr,
      bars
    });
  },



  [IncomeMessageType.HISTORICAL_DATA_UPDATE](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    const bar = {
      barCount: parseInt(fields.shift()),
      date: fields.shift(),
      open: parseFloat(fields.shift()),
      close: parseFloat(fields.shift()),
      high: parseFloat(fields.shift()),
      low: parseFloat(fields.shift()),
      average: parseFloat(fields.shift()),
      volume: parseInt(fields.shift())
    };

    this.requestIdResolve(requestId, bar);
  },



  // HandleInfo(proc=processBondContractDataMsg),
  [IncomeMessageType.BOND_CONTRACT_DATA]: noop('BOND_CONTRACT_DATA'),



  // HandleInfo(wrap=EWrapper.scannerParameters),
  [IncomeMessageType.SCANNER_PARAMETERS](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.SCANNER_PARAMETERS, fields[2]);
  },



  [IncomeMessageType.SCANNER_DATA](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    fields.shift();
    const requestId = parseInt(fields.shift());
    const numberOfElements = parseInt(fields.shift());
    const items = [];

    for (let n = 0; n < numberOfElements; n++) {
      const item: any = {
        contractDetails: {},
        rank: parseInt(fields.shift())
      };

      item.contractDetails.contract.conId = parseInt(fields.shift());   // ver 3 field
      item.contractDetails.contract.symbol = fields.shift();
      item.contractDetails.contract.secType = fields.shift();
      item.contractDetails.contract.lastTradeDateOrContractMonth = fields.shift();
      // TODO where is decode???
      // item.contractDetails.contract.strike = decode(float, fields)
      item.contractDetails.contract.right = fields.shift();
      item.contractDetails.contract.exchange = fields.shift();
      item.contractDetails.contract.currency = fields.shift();
      item.contractDetails.contract.localSymbol = fields.shift();
      item.contractDetails.marketName = fields.shift();
      item.contractDetails.contract.tradingClass = fields.shift();
      item.distance = fields.shift();
      item.benchmark = fields.shift();
      item.projection = fields.shift();
      item.legsStr = fields.shift();
      items.push(item);
    }

    this.requestIdResolve(requestId, items);
  },



  // HandleInfo(proc=processTickOptionComputationMsg
  [IncomeMessageType.TICK_OPTION_COMPUTATION]: handler_TICK_OPTION_COMPUTATION,
  [IncomeMessageType.TICK_GENERIC]: handler_TICK_GENERIC,
  [IncomeMessageType.TICK_STRING]: handler_TICK_STRING,



  // HandleInfo(wrap=EWrapper.tickEFP)
  [IncomeMessageType.TICK_EFP]: noop('TICK_EFP'),



  [IncomeMessageType.CURRENT_TIME](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.CURRENT_TIME, parseInt(fields[2]));
  },



  [IncomeMessageType.REAL_TIME_BARS](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    parseInt(fields.shift());
    const requestId = parseInt(fields.shift());

    const bar = {
      time: parseInt(fields.shift()),
      open: parseFloat(fields.shift()),
      high: parseFloat(fields.shift()),
      low: parseFloat(fields.shift()),
      close: parseFloat(fields.shift()),
      volume: parseInt(fields.shift()),
      wap: parseFloat(fields.shift()),
      count: parseInt(fields.shift())
    };

    this.requestIdResolve(requestId, bar);
  },



  // HandleInfo(wrap=EWrapper.fundamentalData),
  [IncomeMessageType.FUNDAMENTAL_DATA]: noop('FUNDAMENTAL_DATA'),



  [IncomeMessageType.CONTRACT_DATA_END](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.requestIdResolve(fields[2], this.requestIdStorageArray(fields[2]));
  },



  [IncomeMessageType.OPEN_ORDER_END](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.OPEN_ORDER_END,
      this.messageTypeStorageArray(IncomeMessageType.OPEN_ORDER_END));
  },



  // HandleInfo(wrap=EWrapper.accountDownloadEnd),
  [IncomeMessageType.ACCT_DOWNLOAD_END]: noop('ACCT_DOWNLOAD_END'),
  // HandleInfo(wrap=EWrapper.execDetailsEnd),
  [IncomeMessageType.EXECUTION_DATA_END]: noop('EXECUTION_DATA_END'),
  // HandleInfo(proc=processDeltaNeutralValidationMsg),
  [IncomeMessageType.DELTA_NEUTRAL_VALIDATION]: noop('DELTA_NEUTRAL_VALIDATION'),



  [IncomeMessageType.TICK_SNAPSHOT_END]: handler_TICK_SNAPSHOT_END,
  [IncomeMessageType.MARKET_DATA_TYPE]: handler_MARKET_DATA_TYPE,



  // HandleInfo(proc=processCommissionReportMsg),
  [IncomeMessageType.COMMISSION_REPORT]: noop('COMMISSION_REPORT'),



  [IncomeMessageType.POSITION_DATA](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const version = parseInt(fields.shift());

    const account = fields.shift();

    // decode contract fields
    const contract = {
      conId: parseInt(fields.shift()),
      symbol: fields.shift(),
      secType: fields.shift(),
      lastTradeDateOrContractMonth: fields.shift(),
      strike: parseFloat(fields.shift()),
      right: fields.shift(),
      multiplier: fields.shift(),
      exchange: fields.shift(),
      currency: fields.shift(),
      localSymbol: fields.shift(),
      tradingClass: version >= 2 ? fields.shift() : undefined
    };

    let position;
    if (this.serverVersion >= ServerVersion.MIN_SERVER_VER_FRACTIONAL_POSITIONS) {
      position = parseFloat(fields.shift());
    } else {
      position = parseInt(fields.shift());
    }

    let avgCost = 0;
    if (version >= 3) {
      avgCost = parseFloat(fields.shift());
    }

    const storage = this.messageTypeStorageMap(IncomeMessageType.POSITION_END);
    storage[contract.conId] = {
      contract,
      position,
      avgCost
    };
  },



  [IncomeMessageType.POSITION_END](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(IncomeMessageType.POSITION_END,
      this.messageTypeStorageMap(IncomeMessageType.POSITION_END));
  },



  // HandleInfo(wrap=EWrapper.accountSummary),
  [IncomeMessageType.ACCOUNT_SUMMARY]: noop('ACCOUNT_SUMMARY'),
  // HandleInfo(wrap=EWrapper.accountSummaryEnd),
  [IncomeMessageType.ACCOUNT_SUMMARY_END]: noop('ACCOUNT_SUMMARY_END'),
  // HandleInfo(wrap=EWrapper.verifyMessageAPI),
  [IncomeMessageType.VERIFY_MESSAGE_API]: noop('VERIFY_MESSAGE_API'),
  // HandleInfo(wrap=EWrapper.verifyCompleted),
  [IncomeMessageType.VERIFY_COMPLETED]: noop('VERIFY_COMPLETED'),
  // HandleInfo(wrap=EWrapper.displayGroupList),
  [IncomeMessageType.DISPLAY_GROUP_LIST]: noop('DISPLAY_GROUP_LIST'),
  // HandleInfo(wrap=EWrapper.displayGroupUpdated),
  [IncomeMessageType.DISPLAY_GROUP_UPDATED]: noop('DISPLAY_GROUP_UPDATED'),
  // HandleInfo(wrap=EWrapper.verifyAndAuthMessageAPI),
  [IncomeMessageType.VERIFY_AND_AUTH_MESSAGE_API]: noop('VERIFY_AND_AUTH_MESSAGE_API'),
  // HandleInfo(wrap=EWrapper.verifyAndAuthCompleted),
  [IncomeMessageType.VERIFY_AND_AUTH_COMPLETED]: noop('VERIFY_AND_AUTH_COMPLETED'),
  // HandleInfo(proc=processPositionMultiMsg),
  [IncomeMessageType.POSITION_MULTI]: noop('POSITION_MULTI'),
  // HandleInfo(wrap=EWrapper.positionMultiEnd),
  [IncomeMessageType.POSITION_MULTI_END]: noop('POSITION_MULTI_END'),
  // HandleInfo(wrap=EWrapper.accountUpdateMulti),
  [IncomeMessageType.ACCOUNT_UPDATE_MULTI]: noop('ACCOUNT_UPDATE_MULTI'),
  // HandleInfo(wrap=EWrapper.accountUpdateMultiEnd),
  [IncomeMessageType.ACCOUNT_UPDATE_MULTI_END]: noop('ACCOUNT_UPDATE_MULTI_END'),



  [IncomeMessageType.SECURITY_DEFINITION_OPTION_PARAMETER](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();

    const requestId = parseInt(fields.shift());
    const exchange = fields.shift();
    const underlyingConId = parseInt(fields.shift());
    const tradingClass = fields.shift();
    const multiplier = fields.shift();

    const expCount = parseInt(fields.shift());
    const expirations = [];

    for (let n = 0; n < expCount; n++) {
      expirations.push(fields.shift());
    }

    const strikeCount = parseInt(fields.shift());
    const strikes = [];
    for (let n = 0; n < strikeCount; n++) {
      strikes.push(parseFloat(fields.shift()));
    }

    const storage = this.requestIdStorageArray(requestId);
    storage.push({
      exchange,
      underlyingConId,
      tradingClass,
      multiplier,
      expCount,
      expirations,
      strikes,
    });
  },



  [IncomeMessageType.SECURITY_DEFINITION_OPTION_PARAMETER_END](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    this.requestIdResolve(requestId, this.requestIdStorageArray(requestId));
  },



  // HandleInfo(proc=processSoftDollarTiersMsg),
  [IncomeMessageType.SOFT_DOLLAR_TIERS]: noop('SOFT_DOLLAR_TIERS'),
  // HandleInfo(proc=processFamilyCodesMsg),
  [IncomeMessageType.FAMILY_CODES]: noop('FAMILY_CODES'),
  // HandleInfo(proc=processSymbolSamplesMsg),
  [IncomeMessageType.SYMBOL_SAMPLES]: noop('SYMBOL_SAMPLES'),
  // HandleInfo(proc=processSmartComponents),
  [IncomeMessageType.SMART_COMPONENTS]: noop('SMART_COMPONENTS'),



  [IncomeMessageType.TICK_REQ_PARAMS]: handler_TICK_REQ_PARAMS,



  // HandleInfo(proc=processMktDepthExchanges),
  [IncomeMessageType.MKT_DEPTH_EXCHANGES]: noop('MKT_DEPTH_EXCHANGES'),



  [IncomeMessageType.HEAD_TIMESTAMP](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    const headTimestamp = fields.shift();
    this.requestIdResolve(requestId, headTimestamp);
  },



  // HandleInfo(proc=processTickNews),
  [IncomeMessageType.TICK_NEWS]: noop('TICK_NEWS'),
  // HandleInfo(proc=processNewsProviders),
  [IncomeMessageType.NEWS_PROVIDERS]: noop('NEWS_PROVIDERS'),
  // HandleInfo(proc=processNewsArticle),
  [IncomeMessageType.NEWS_ARTICLE]: noop('NEWS_ARTICLE'),
  // HandleInfo(proc=processHistoricalNews),
  [IncomeMessageType.HISTORICAL_NEWS]: noop('HISTORICAL_NEWS'),
  // HandleInfo(proc=processHistoricalNewsEnd),
  [IncomeMessageType.HISTORICAL_NEWS_END]: noop('HISTORICAL_NEWS_END'),
  // HandleInfo(proc=processHistogramData),
  [IncomeMessageType.HISTOGRAM_DATA]: noop('HISTOGRAM_DATA'),
  // HandleInfo(proc=processRerouteMktDataReq),
  [IncomeMessageType.REROUTE_MKT_DATA_REQ]: noop('REROUTE_MKT_DATA_REQ'),
  // HandleInfo(proc=processRerouteMktDepthReq),
  [IncomeMessageType.REROUTE_MKT_DEPTH_REQ]: noop('REROUTE_MKT_DEPTH_REQ'),
  // HandleInfo(proc=processMarketRuleMsg),
  [IncomeMessageType.MARKET_RULE]: noop('MARKET_RULE'),
  // HandleInfo(proc=processPnLMsg),
  [IncomeMessageType.PNL]: noop('PNL'),
  // HandleInfo(proc=processPnLSingleMsg),
  [IncomeMessageType.PNL_SINGLE]: noop('PNL_SINGLE'),



  [IncomeMessageType.HISTORICAL_TICKS](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    const tickCount = parseInt(fields.shift());

    const ticks = [];

    for (let n = 0; n < tickCount; n++) {
      const historicalTick: any = {
        time: parseInt(fields.shift())
      };
      fields.shift();   // for consistency
      historicalTick.price = parseFloat(fields.shift());
      historicalTick.size = parseInt(fields.shift());
      ticks.push(historicalTick);
    }

    const done = fields.shift();

    this.requestIdResolve(requestId, ticks);
  },



  [IncomeMessageType.HISTORICAL_TICKS_BID_ASK](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    const tickCount = parseInt(fields.shift());

    const ticks = [];

    for (let n = 0; n < tickCount; n++) {
      const historicalTickBidAsk: any = {
        time: parseInt(fields.shift())
      };

      historicalTickBidAsk.mask = parseInt(fields.shift());
      /*tickAttribBidAsk = TickAttribBidAsk()
      tickAttribBidAsk.askPastHigh = mask & 1 != 0
      tickAttribBidAsk.bidPastLow = mask & 2 != 0
      historicalTickBidAsk.tickAttribBidAsk = tickAttribBidAsk*/
      historicalTickBidAsk.priceBid = parseFloat(fields.shift());
      historicalTickBidAsk.priceAsk = parseFloat(fields.shift());
      historicalTickBidAsk.sizeBid = parseInt(fields.shift());
      historicalTickBidAsk.sizeAsk = parseInt(fields.shift());
      ticks.push(historicalTickBidAsk);
    }

    const done = fields.shift();

    this.requestIdResolve(requestId, ticks);
  },



  [IncomeMessageType.HISTORICAL_TICKS_LAST](this: IncomeFieldsetHandlerBus, fields: any[]) {
    fields.shift();
    const requestId = parseInt(fields.shift());
    const tickCount = parseInt(fields.shift());

    const ticks = [];

    for (let n = 0; n < tickCount; n++) {
      const historicalTickLast = {
        time: parseInt(fields.shift()),
        mask: parseInt(fields.shift()),
        price: parseFloat(fields.shift()),
        size: parseInt(fields.shift()),
        exchange: fields.shift(),
        specialConditions: fields.shift()
      };

      ticks.push(historicalTickLast);
    }

    const done = fields.shift();

    this.requestIdResolve(requestId, ticks);
  },



  [IncomeMessageType.TICK_BY_TICK]: handler_TICK_BY_TICK,



  // HandleInfo(proc=processOrderBoundMsg),
  [IncomeMessageType.ORDER_BOUND]: noop('ORDER_BOUND'),



  [IncomeMessageType.COMPLETED_ORDER]: handler_COMPLETED_ORDER,



  [IncomeMessageType.COMPLETED_ORDERS_END](this: IncomeFieldsetHandlerBus, fields: any[]) {
    this.messageTypeResolve(
      IncomeMessageType.COMPLETED_ORDERS_END,
      this.messageTypeStorageArray(IncomeMessageType.COMPLETED_ORDERS_END)
    );
  },



  [IncomeMessageType._SERVER_VERSION](this: IncomeFieldsetHandlerBus, fields: any[]) {
    const serverVersion = parseInt(fields[0]);
    this.messageTypeResolve(IncomeMessageType._SERVER_VERSION, serverVersion);
  }
};
