import TickType from '../constants/tick-type';
import { IncomeFieldsetHandlerBus } from '../utils/income-fieldset-handler-bus';
import { OrderDecoder } from './order-decoder';
import IncomeMessageType from '../constants/income-message-type';
import ServerVersion from '../constants/server-version'

const tickToSizeTick = {
  [TickType.BID]: TickType.BID_SIZE,
  [TickType.ASK]: TickType.ASK_SIZE,
  [TickType.LAST]: TickType.LAST_SIZE,
  [TickType.DELAYED_BID]: TickType.DELAYED_BID_SIZE,
  [TickType.DELAYED_ASK]: TickType.DELAYED_ASK_SIZE,
  [TickType.DELAYED_LAST]: TickType.DELAYED_LAST_SIZE
};



const tickToStorage: {
  [x: number]: (s: any, v: any) => void;
} = {
  [TickType.BID_SIZE](s, v) { s.bidSize = v; },
  [TickType.BID](s, v) { s.bid = v; },
  [TickType.ASK](s, v) { s.ask = v; },
  [TickType.ASK_SIZE](s, v) { s.askSize = v; },
  [TickType.LAST](s, v) { s.last = v; },
  [TickType.LAST_SIZE](s, v) { s.lastSize = v; },
  [TickType.HIGH](s, v) { s.high = v; },
  [TickType.LOW](s, v) { s.low = v; },
  [TickType.VOLUME](s, v) { s.volume = v; },
  [TickType.CLOSE](s, v) { s.close = v; },
  [TickType.BID_OPTION_COMPUTATION](s, v) { s.bidOptionComputation = v; },
  [TickType.ASK_OPTION_COMPUTATION](s, v) { s.askOptionComputation = v; },
  [TickType.LAST_OPTION_COMPUTATION](s, v) { s.lastOptionComputation = v; },
  [TickType.MODEL_OPTION](s, v) { s.modelOption = v; },
  [TickType.OPEN](s, v) { s.open = v; },
  [TickType.LOW_13_WEEK](s, v) { s.low13week = v; },
  [TickType.HIGH_13_WEEK](s, v) { s.high13week = v; },
  [TickType.LOW_26_WEEK](s, v) { s.low26week = v; },
  [TickType.HIGH_26_WEEK](s, v) { s.high26week = v; },
  [TickType.LOW_52_WEEK](s, v) { s.low52week = v; },
  [TickType.HIGH_52_WEEK](s, v) { s.high52week = v; },
  [TickType.AVG_VOLUME](s, v) { s.avgVolume = v; },
  [TickType.OPEN_INTEREST](s, v) { s.openInterest = v; },
  [TickType.OPTION_HISTORICAL_VOL](s, v) { s.optionHistoricalVol = v; },
  [TickType.OPTION_IMPLIED_VOL](s, v) { s.optionImpliedVol = v; },
  [TickType.OPTION_BID_EXCH](s, v) { s.optionBidExch = v; },
  [TickType.OPTION_ASK_EXCH](s, v) { s.optionAskExch = v; },
  [TickType.OPTION_CALL_OPEN_INTEREST](s, v) { s.optionCallOpenInterest = v; },
  [TickType.OPTION_PUT_OPEN_INTEREST](s, v) { s.optionPutOpenInterest = v; },
  [TickType.OPTION_CALL_VOLUME](s, v) { s.optionCallVolume = v; },
  [TickType.OPTION_PUT_VOLUME](s, v) { s.optionPutVolume = v; },
  [TickType.INDEX_FUTURE_PREMIUM](s, v) { s.indexFuturePremium = v; },
  [TickType.BID_EXCH](s, v) { s.bidExch = v; },
  [TickType.ASK_EXCH](s, v) { s.askExch = v; },
  [TickType.AUCTION_VOLUME](s, v) { s.auctionVolume = v; },
  [TickType.AUCTION_PRICE](s, v) { s.auctionPrice = v; },
  [TickType.AUCTION_IMBALANCE](s, v) { s.auctionImbalance = v; },
  [TickType.MARK_PRICE](s, v) { s.markPrice = v; },
  [TickType.BID_EFP_COMPUTATION](s, v) { s.bidEfpComputation = v; },
  [TickType.ASK_EFP_COMPUTATION](s, v) { s.askEfpComputation = v; },
  [TickType.LAST_EFP_COMPUTATION](s, v) { s.lastEfpComputation = v; },
  [TickType.OPEN_EFP_COMPUTATION](s, v) { s.openEfpComputation = v; },
  [TickType.HIGH_EFP_COMPUTATION](s, v) { s.highEfpComputation = v; },
  [TickType.LOW_EFP_COMPUTATION](s, v) { s.lowEfpComputation = v; },
  [TickType.CLOSE_EFP_COMPUTATION](s, v) { s.closeEfpComputation = v; },
  [TickType.LAST_TIMESTAMP](s, v) { s.lastTimestamp = v; },
  [TickType.SHORTABLE](s, v) { s.shortable = v; },
  [TickType.FUNDAMENTAL_RATIOS](s, v) { s.fundamentalRatios = v; },
  [TickType.RT_VOLUME](s, v) { s.rtVolume = v; },
  [TickType.HALTED](s, v) { s.halted = v; },
  [TickType.BID_YIELD](s, v) { s.bidYield = v; },
  [TickType.ASK_YIELD](s, v) { s.askYield = v; },
  [TickType.LAST_YIELD](s, v) { s.lastYield = v; },
  [TickType.CUST_OPTION_COMPUTATION](s, v) { s.custOptionComputation = v; },
  [TickType.TRADE_COUNT](s, v) { s.tradeCount = v; },
  [TickType.TRADE_RATE](s, v) { s.tradeRate = v; },
  [TickType.VOLUME_RATE](s, v) { s.volumeRate = v; },
  [TickType.LAST_RTH_TRADE](s, v) { s.lastRthTrade = v; },
  [TickType.RT_HISTORICAL_VOL](s, v) { s.rtHistoricalVol = v; },
  [TickType.IB_DIVIDENDS](s, v) { s.ibDividends = v; },
  [TickType.BOND_FACTOR_MULTIPLIER](s, v) { s.bondFactorMultiplier = v; },
  [TickType.REGULATORY_IMBALANCE](s, v) { s.regulatoryImbalance = v; },
  [TickType.NEWS_TICK](s, v) { s.newsTick = v; },
  [TickType.SHORT_TERM_VOLUME_3_MIN](s, v) { s.shortTermVolume3min = v; },
  [TickType.SHORT_TERM_VOLUME_5_MIN](s, v) { s.shortTermVolume5min = v; },
  [TickType.SHORT_TERM_VOLUME_10_MIN](s, v) { s.shortTermVolume10min = v; },
  [TickType.DELAYED_BID](s, v) { s.delayedBid = v; },
  [TickType.DELAYED_ASK](s, v) { s.delayedAsk = v; },
  [TickType.DELAYED_LAST](s, v) { s.delayedLast = v; },
  [TickType.DELAYED_BID_SIZE](s, v) { s.delayedBidSize = v; },
  [TickType.DELAYED_ASK_SIZE](s, v) { s.delayedAskSize = v; },
  [TickType.DELAYED_LAST_SIZE](s, v) { s.delayed_lastSize = v; },
  [TickType.DELAYED_HIGH](s, v) { s.delayedHigh = v; },
  [TickType.DELAYED_LOW](s, v) { s.delayedLow = v; },
  [TickType.DELAYED_VOLUME](s, v) { s.delayedVolume = v; },
  [TickType.DELAYED_CLOSE](s, v) { s.delayedClose = v; },
  [TickType.DELAYED_OPEN](s, v) { s.delayedOpen = v; },
  [TickType.RT_TRD_VOLUME](s, v) { s.rtTrdVolume = v; },
  [TickType.CREDITMAN_MARK_PRICE](s, v) { s.creditmanMarkPrice = v; },
  [TickType.CREDITMAN_SLOW_MARK_PRICE](s, v) { s.creditmanSlowMarkPrice = v; },
  [TickType.DELAYED_BID_OPTION](s, v) { s.delayedBidOption = v; },
  [TickType.DELAYED_ASK_OPTION](s, v) { s.delayedAskOption = v; },
  [TickType.DELAYED_LAST_OPTION](s, v) { s.delayedLastOption = v; },
  [TickType.DELAYED_MODEL_OPTION](s, v) { s.delayedModelOption = v; },
  [TickType.LAST_EXCH](s, v) { s.lastExch = v; },
  [TickType.LAST_REG_TIME](s, v) { s.lastRegTime = v; },
  [TickType.FUTURES_OPEN_INTEREST](s, v) { s.futuresOpenInterest = v; },
  [TickType.AVG_OPT_VOLUME](s, v) { s.avgOptVolume = v; },
  [TickType.DELAYED_LAST_TIMESTAMP](s, v) { s.delayedLastTimestamp = v; },
  [TickType.SHORTABLE_SHARES](s, v) { s.shortableShares = v; }
};

function applyTickerData(storage: any, type: number, value: number) {
  const variator = tickToStorage[type];
  if (variator) {
    variator(storage, value);
  }
}

export function handler_TICK_PRICE(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();

  const requestId = parseInt(fields.shift() as string);
  const tickType = parseInt(fields.shift() as string);
  const price = parseFloat(fields.shift() as string);
  const size = parseInt(fields.shift() as string);   // ver 2 field
  const mask = parseInt(fields.shift() as string);   // ver 3 field

  const storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, price);

  this.requestIdEmit(requestId, 'tick', {
    tickType,
    value: price,
    mask,
    ticker: storage,
  });

  // process ver 2 fields
  const sizeTickType = tickToSizeTick[tickType];
  if (sizeTickType) {
    applyTickerData(storage, sizeTickType, size);

    this.requestIdEmit(requestId, 'tick', {
      tickType: sizeTickType,
      value: size,
      ticker: storage
    });
  }
}

export function handler_TICK_SIZE(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();

  const requestId = parseInt(fields.shift() as string);
  const tickType = parseInt(fields.shift() as string);
  const size = parseInt(fields.shift() as string);

  const storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, size);

  this.requestIdEmit(requestId, 'tickSize', {
    tickType,
    size,
    ticker: storage
  });
}

export function handler_TICK_GENERIC(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();
  const requestId = parseInt(fields.shift() as string);
  const tickType = parseInt(fields.shift() as string);
  const value = parseFloat(fields.shift() as string);

  const storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, value);

  this.requestIdEmit(requestId, 'tick', {
    tickType,
    value,
    ticker: storage
  });
}

export function handler_TICK_STRING(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();
  const requestId = parseInt(fields.shift() as string);
  const tickType = parseInt(fields.shift() as string);
  const value = fields.shift();

  const storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, value);

  this.requestIdEmit(requestId, 'tick', {
    tickType,
    value,
    ticker: storage
  });
}

export function handler_TICK_SNAPSHOT_END(this: IncomeFieldsetHandlerBus, fields: any[]) {
  const requestId = parseInt(fields[2]);
  this.requestIdResolve(requestId, this.requestIdStorageMap(requestId));
}

export function handler_MARKET_DATA_TYPE(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();
  const requestId = parseInt(fields.shift() as string);
  const marketDataType = parseInt(fields.shift() as string);

  const storage = this.requestIdStorageMap(requestId);
  storage.marketDataType = marketDataType

  this.requestIdEmit(requestId, 'marketDataType', {
    marketDataType,
    ticker: storage
  });
}

export function handler_TICK_REQ_PARAMS(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();

  const requestId = parseInt(fields.shift() as string);
  const minTick = parseFloat(fields.shift() as string);
  const bboExchange = fields.shift();
  const snapshotPermissions = parseInt(fields.shift() as string);

  this.requestIdEmit(requestId, 'reqParameters', {
    minTick,
    bboExchange,
    snapshotPermissions
  });
}

export function handler_TICK_BY_TICK(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  const requestId = parseInt(fields.shift() as string);
  const tickType = parseInt(fields.shift() as string);
  const time = parseInt(fields.shift() as string);

  if (tickType !== 0 && (tickType === 1 || tickType === 2)) {
    // Last or AllLast
    const price = parseFloat(fields.shift() as string);
    const size = parseInt(fields.shift() as string);
    const mask = parseInt(fields.shift() as string);

    const exchange = fields.shift();
    const specialConditions = fields.shift();

    this.requestIdEmit(requestId, 'tickByTick', {
      tickType,
      time,
      price,
      size,
      exchange,
      specialConditions
    });
  } else if (tickType === 3) {
    // BidAsk
    const bidPrice = parseFloat(fields.shift() as string);
    const askPrice = parseFloat(fields.shift() as string);
    const bidSize = parseInt(fields.shift() as string);
    const askSize = parseInt(fields.shift() as string);
    const mask = parseInt(fields.shift() as string);

    this.requestIdEmit(requestId, 'tickByTick', {
      time,
      bidPrice,
      askPrice,
      bidSize,
      askSize,
      mask
    });
  } else if (tickType === 4) {
    // MidPoint
    const midPoint = parseFloat(fields.shift() as string);

    this.requestIdEmit(requestId, 'tickByTick', {
      time,
      midPoint
    });
  }
}



export function handler_TICK_OPTION_COMPUTATION(this: IncomeFieldsetHandlerBus, fields: any[]) {
  const version = parseInt(fields.shift() as string);
  const requestId = parseInt(fields.shift() as string);
  const tickTypeInt = parseInt(fields.shift() as string);

  let impliedVol: number | null = parseFloat(fields.shift() as string);
  let delta: number | null = parseFloat(fields.shift() as string);
  let optPrice = null;
  let pvDividend = null;
  let gamma = null;
  let vega = null;
  let theta = null;
  let undPrice = null;

  // -1 is the "not computed" indicator
  if (impliedVol < 0) {
    impliedVol = null;
  }
  // -2 is the "not computed" indicator
  if (delta === -2) {
    delta = null;
  }

  if (version >= 6 ||
    tickTypeInt === TickType.MODEL_OPTION ||
    tickTypeInt === TickType.DELAYED_MODEL_OPTION) {
    optPrice = parseFloat(fields.shift() as string);
    pvDividend = parseFloat(fields.shift() as string);

    // -1 is the "not computed" indicator
    if (optPrice === -1) {
      optPrice = null;
    }
    // -1 is the "not computed" indicator
    if (pvDividend === -1) {
      pvDividend = null;
    }
  }

  if (version >= 6) {
    gamma = parseFloat(fields.shift() as string);
    vega = parseFloat(fields.shift() as string);
    theta = parseFloat(fields.shift() as string);
    undPrice = parseFloat(fields.shift() as string);

    // -2 is the "not yet computed" indicator
    if (gamma === -2) {
      gamma = null;
    }
    // # -2 is the "not yet computed" indicator
    if (vega === -2) {
      vega = null;
    }
    // -2 is the "not yet computed" indicator
    if (theta === -2) {
      theta = null;
    }
    // -1 is the "not computed" indicator
    if (undPrice === -1) {
      undPrice = null;
    }
  }

  const storage = this.requestIdStorageMap(requestId);
  storage.impliedVol = impliedVol;
  storage.delta = delta;
  storage.optPrice = optPrice;
  storage.pvDividend = pvDividend;
  storage.gamma = gamma;
  storage.vega = vega;
  storage.theta = theta;
  storage.undPrice = undPrice;
}

export function handler_OPEN_ORDER(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();

  let version = 0;
  if (this.serverVersion < ServerVersion.MIN_SERVER_VER_ORDER_CONTAINER) {
    version = parseInt(fields.shift() as string);
  }

  const d = new OrderDecoder(version, this.serverVersion, fields);
  d.decodeOrderId();   // read orderId
  d.decodeContractFields();   // read contract fields

  // read order fields
  d.decodeAction();
  d.decodeTotalQuantity();
  d.decodeOrderType();
  d.decodeLmtPrice();
  d.decodeAuxPrice();
  d.decodeTIF();
  d.decodeOcaGroup();
  d.decodeAccount();
  d.decodeOpenClose();
  d.decodeOrigin();
  d.decodeOrderRef();
  d.decodeClientId();
  d.decodePermId();
  d.decodeOutsideRth();
  d.decodeHidden();
  d.decodeDiscretionaryAmt();
  d.decodeGoodAfterTime();
  d.skipSharesAllocation();
  d.decodeFAParams();
  d.decodeModelCode();
  d.decodeGoodTillDate();
  d.decodeRule80A();
  d.decodePercentOffset();
  d.decodeSettlingFirm();
  d.decodeShortSaleParams();
  d.decodeAuctionStrategy();
  d.decodeBoxOrderParams();
  d.decodePegToStkOrVolOrderParams();
  d.decodeDisplaySize();
  d.decodeBlockOrder();
  d.decodeSweepToFill();
  d.decodeAllOrNone();
  d.decodeMinQty();
  d.decodeOcaType();
  d.decodeETradeOnly();
  d.decodeFirmQuoteOnly();
  d.decodeNbboPriceCap();
  d.decodeParentId();
  d.decodeTriggerMethod();
  d.decodeVolOrderParams(true);
  d.decodeTrailParams();
  d.decodeBasisPoints();
  d.decodeComboLegs();
  d.decodeSmartComboRoutingParams();
  d.decodeScaleOrderParams();
  d.decodeHedgeParams();
  d.decodeOptOutSmartRouting();
  d.decodeClearingParams();
  d.decodeNotHeld();
  d.decodeDeltaNeutral();
  d.decodeAlgoParams();
  d.decodeSolicited();
  d.decodeWhatIfInfoAndCommission();
  d.decodeVolRandomizeFlags();
  d.decodePegToBenchParams();
  d.decodeConditions();
  d.decodeAdjustedOrderParams();
  d.decodeSoftDollarTier();
  d.decodeCashQty();
  d.decodeDontUseAutoPriceForHedge();
  d.decodeIsOmsContainers();
  d.decodeDiscretionaryUpToLimitPrice();
  d.decodeUsePriceMgmtAlgo();

  const storage = this.messageTypeStorageArray(IncomeMessageType.OPEN_ORDER_END);
  storage.push({
    contract: d.contract,
    order: d.order,
    orderState: d.orderState
  });
}



export function handler_COMPLETED_ORDER(this: IncomeFieldsetHandlerBus, fields: any[]) {
  fields.shift();
  fields.shift();

  const d = new OrderDecoder(10000, this.serverVersion, fields);

  // read contract fields
  d.decodeContractFields();

  // read order fields
  d.decodeAction();
  d.decodeTotalQuantity();
  d.decodeOrderType();
  d.decodeLmtPrice();
  d.decodeAuxPrice();
  d.decodeTIF();
  d.decodeOcaGroup();
  d.decodeAccount();
  d.decodeOpenClose();
  d.decodeOrigin();
  d.decodeOrderRef();
  d.decodePermId();
  d.decodeOutsideRth();
  d.decodeHidden();
  d.decodeDiscretionaryAmt();
  d.decodeGoodAfterTime();
  d.decodeFAParams();
  d.decodeModelCode();
  d.decodeGoodTillDate();
  d.decodeRule80A();
  d.decodePercentOffset();
  d.decodeSettlingFirm();
  d.decodeShortSaleParams();
  d.decodeBoxOrderParams();
  d.decodePegToStkOrVolOrderParams();
  d.decodeDisplaySize();
  d.decodeSweepToFill();
  d.decodeAllOrNone();
  d.decodeMinQty();
  d.decodeOcaType();
  d.decodeTriggerMethod();
  d.decodeVolOrderParams(false);
  d.decodeTrailParams();
  d.decodeComboLegs();
  d.decodeSmartComboRoutingParams();
  d.decodeScaleOrderParams();
  d.decodeHedgeParams();
  d.decodeClearingParams();
  d.decodeNotHeld();
  d.decodeDeltaNeutral();
  d.decodeAlgoParams();
  d.decodeSolicited();
  d.decodeOrderStatus();
  d.decodeVolRandomizeFlags();
  d.decodePegToBenchParams();
  d.decodeConditions();
  d.decodeStopPriceAndLmtPriceOffset();
  d.decodeCashQty();
  d.decodeDontUseAutoPriceForHedge();
  d.decodeIsOmsContainers();
  d.decodeAutoCancelDate();
  d.decodeFilledQuantity();
  d.decodeRefFuturesConId();
  d.decodeAutoCancelParent();
  d.decodeShareholder();
  d.decodeImbalanceOnly();
  d.decodeRouteMarketableToBbo();
  d.decodeParentPermId();
  d.decodeCompletedTime();
  d.decodeCompletedStatus();

  const storage = this.messageTypeStorageArray(IncomeMessageType.COMPLETED_ORDERS_END);
  storage.push({
    contract: d.contract,
    order: d.order,
    orderState: d.orderState
  });
}