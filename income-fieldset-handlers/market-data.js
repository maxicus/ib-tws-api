import TickType from '../const-tick-type.js';



let tickToSizeTick = {
  [TickType.BID]: TickType.BID_SIZE,
  [TickType.ASK]: TickType.ASK_SIZE,
  [TickType.LAST]: TickType.LAST_SIZE,
  [TickType.DELAYED_BID]: TickType.DELAYED_BID_SIZE,
  [TickType.DELAYED_ASK]: TickType.DELAYED_ASK_SIZE,
  [TickType.DELAYED_LAST]: TickType.DELAYED_LAST_SIZE
};



let tickToStorage = {
  [TickType.BID_SIZE]: function(s, v) { s.bidSize = v; },
  [TickType.BID]: function(s, v) { s.bid = v; },
  [TickType.ASK]: function(s, v) { s.ask = v; },
  [TickType.ASK_SIZE]: function(s, v) { s.askSize = v; },
  [TickType.LAST]: function(s, v) { s.last = v; },
  [TickType.LAST_SIZE]: function(s, v) { s.lastSize = v; },
  [TickType.HIGH]: function(s, v) { s.high = v; },
  [TickType.LOW]: function(s, v) { s.low = v; },
  [TickType.VOLUME]: function(s, v) { s.volume = v; },
  [TickType.CLOSE]: function(s, v) { s.close = v; },
  [TickType.BID_OPTION_COMPUTATION]: function(s, v) { s.bidOptionComputation = v; },
  [TickType.ASK_OPTION_COMPUTATION]: function(s, v) { s.askOptionComputation = v; },
  [TickType.LAST_OPTION_COMPUTATION]: function(s, v) { s.lastOptionComputation = v; },
  [TickType.MODEL_OPTION]: function(s, v) { s.modelOption = v; },
  [TickType.OPEN]: function(s, v) { s.open = v; },
  [TickType.LOW_13_WEEK]: function(s, v) { s.low13week = v; },
  [TickType.HIGH_13_WEEK]: function(s, v) { s.high13week = v; },
  [TickType.LOW_26_WEEK]: function(s, v) { s.low26week = v; },
  [TickType.HIGH_26_WEEK]: function(s, v) { s.high26week = v; },
  [TickType.LOW_52_WEEK]: function(s, v) { s.low52week = v; },
  [TickType.HIGH_52_WEEK]: function(s, v) { s.high52week = v; },
  [TickType.AVG_VOLUME]: function(s, v) { s.avgVolume = v; },
  [TickType.OPEN_INTEREST]: function(s, v) { s.openInterest = v; },
  [TickType.OPTION_HISTORICAL_VOL]: function(s, v) { s.optionHistoricalVol = v; },
  [TickType.OPTION_IMPLIED_VOL]: function(s, v) { s.optionImpliedVol = v; },
  [TickType.OPTION_BID_EXCH]: function(s, v) { s.optionBidExch = v; },
  [TickType.OPTION_ASK_EXCH]: function(s, v) { s.optionAskExch = v; },
  [TickType.OPTION_CALL_OPEN_INTEREST]: function(s, v) { s.optionCallOpenInterest = v; },
  [TickType.OPTION_PUT_OPEN_INTEREST]: function(s, v) { s.optionPutOpenInterest = v; },
  [TickType.OPTION_CALL_VOLUME]: function(s, v) { s.optionCallVolume = v; },
  [TickType.OPTION_PUT_VOLUME]: function(s, v) { s.optionPutVolume = v; },
  [TickType.INDEX_FUTURE_PREMIUM]: function(s, v) { s.indexFuturePremium = v; },
  [TickType.BID_EXCH]: function(s, v) { s.bidExch = v; },
  [TickType.ASK_EXCH]: function(s, v) { s.askExch = v; },
  [TickType.AUCTION_VOLUME]: function(s, v) { s.auctionVolume = v; },
  [TickType.AUCTION_PRICE]: function(s, v) { s.auctionPrice = v; },
  [TickType.AUCTION_IMBALANCE]: function(s, v) { s.auctionImbalance = v; },
  [TickType.MARK_PRICE]: function(s, v) { s.markPrice = v; },
  [TickType.BID_EFP_COMPUTATION]: function(s, v) { s.bidEfpComputation = v; },
  [TickType.ASK_EFP_COMPUTATION]: function(s, v) { s.askEfpComputation = v; },
  [TickType.LAST_EFP_COMPUTATION]: function(s, v) { s.lastEfpComputation = v; },
  [TickType.OPEN_EFP_COMPUTATION]: function(s, v) { s.openEfpComputation = v; },
  [TickType.HIGH_EFP_COMPUTATION]: function(s, v) { s.highEfpComputation = v; },
  [TickType.LOW_EFP_COMPUTATION]: function(s, v) { s.lowEfpComputation = v; },
  [TickType.CLOSE_EFP_COMPUTATION]: function(s, v) { s.closeEfpComputation = v; },
  [TickType.LAST_TIMESTAMP]: function(s, v) { s.lastTimestamp = v; },
  [TickType.SHORTABLE]: function(s, v) { s.shortable = v; },
  [TickType.FUNDAMENTAL_RATIOS]: function(s, v) { s.fundamentalRatios = v; },
  [TickType.RT_VOLUME]: function(s, v) { s.rtVolume = v; },
  [TickType.HALTED]: function(s, v) { s.halted = v; },
  [TickType.BID_YIELD]: function(s, v) { s.bidYield = v; },
  [TickType.ASK_YIELD]: function(s, v) { s.askYield = v; },
  [TickType.LAST_YIELD]: function(s, v) { s.lastYield = v; },
  [TickType.CUST_OPTION_COMPUTATION]: function(s, v) { s.custOptionComputation = v; },
  [TickType.TRADE_COUNT]: function(s, v) { s.tradeCount = v; },
  [TickType.TRADE_RATE]: function(s, v) { s.tradeRate = v; },
  [TickType.VOLUME_RATE]: function(s, v) { s.volumeRate = v; },
  [TickType.LAST_RTH_TRADE]: function(s, v) { s.lastRthTrade = v; },
  [TickType.RT_HISTORICAL_VOL]: function(s, v) { s.rtHistoricalVol = v; },
  [TickType.IB_DIVIDENDS]: function(s, v) { s.ibDividends = v; },
  [TickType.BOND_FACTOR_MULTIPLIER]: function(s, v) { s.bondFactorMultiplier = v; },
  [TickType.REGULATORY_IMBALANCE]: function(s, v) { s.regulatoryImbalance = v; },
  [TickType.NEWS_TICK]: function(s, v) { s.newsTick = v; },
  [TickType.SHORT_TERM_VOLUME_3_MIN]: function(s, v) { s.shortTermVolume3min = v; },
  [TickType.SHORT_TERM_VOLUME_5_MIN]: function(s, v) { s.shortTermVolume5min = v; },
  [TickType.SHORT_TERM_VOLUME_10_MIN]: function(s, v) { s.shortTermVolume10min = v; },
  [TickType.DELAYED_BID]: function(s, v) { s.delayedBid = v; },
  [TickType.DELAYED_ASK]: function(s, v) { s.delayedAsk = v; },
  [TickType.DELAYED_LAST]: function(s, v) { s.delayedLast = v; },
  [TickType.DELAYED_BID_SIZE]: function(s, v) { s.delayedBidSize = v; },
  [TickType.DELAYED_ASK_SIZE]: function(s, v) { s.delayedAskSize = v; },
  [TickType.DELAYED_LAST_SIZE]: function(s, v) { s.delayed_lastSize = v; },
  [TickType.DELAYED_HIGH]: function(s, v) { s.delayedHigh = v; },
  [TickType.DELAYED_LOW]: function(s, v) { s.delayedLow = v; },
  [TickType.DELAYED_VOLUME]: function(s, v) { s.delayedVolume = v; },
  [TickType.DELAYED_CLOSE]: function(s, v) { s.delayedClose = v; },
  [TickType.DELAYED_OPEN]: function(s, v) { s.delayedOpen = v; },
  [TickType.RT_TRD_VOLUME]: function(s, v) { s.rtTrdVolume = v; },
  [TickType.CREDITMAN_MARK_PRICE]: function(s, v) { s.creditmanMarkPrice = v; },
  [TickType.CREDITMAN_SLOW_MARK_PRICE]: function(s, v) { s.creditmanSlowMarkPrice = v; },
  [TickType.DELAYED_BID_OPTION]: function(s, v) { s.delayedBidOption = v; },
  [TickType.DELAYED_ASK_OPTION]: function(s, v) { s.delayedAskOption = v; },
  [TickType.DELAYED_LAST_OPTION]: function(s, v) { s.delayedLastOption = v; },
  [TickType.DELAYED_MODEL_OPTION]: function(s, v) { s.delayedModelOption = v; },
  [TickType.LAST_EXCH]: function(s, v) { s.lastExch = v; },
  [TickType.LAST_REG_TIME]: function(s, v) { s.lastRegTime = v; },
  [TickType.FUTURES_OPEN_INTEREST]: function(s, v) { s.futuresOpenInterest = v; },
  [TickType.AVG_OPT_VOLUME]: function(s, v) { s.avgOptVolume = v; },
  [TickType.DELAYED_LAST_TIMESTAMP]: function(s, v) { s.delayedLastTimestamp = v; },
  [TickType.SHORTABLE_SHARES]: function(s, v) { s.shortableShares = v; }
};



function applyTickerData(storage, type, value) {
  let variator = tickToStorage[type];
  if (variator) {
    variator(storage, value);
  }
}



export function handler_TICK_PRICE(fields) {
  fields.shift();
  fields.shift();

  let requestId = parseInt(fields.shift());
  let tickType = parseInt(fields.shift());
  let price = parseFloat(fields.shift());
  let size = parseInt(fields.shift());   // ver 2 field
  let mask = parseInt(fields.shift());   // ver 3 field

  /*
  attrib = TickAttrib()

  attrib.canAutoExecute = attrMask == 1

  if this.serverVersion >= ServerVersion.MIN_SERVER_VER_PAST_LIMIT:
      attrib.canAutoExecute = attrMask & 1 != 0
      attrib.pastLimit = attrMask & 2 != 0
      if this.serverVersion >= ServerVersion.MIN_SERVER_VER_PRE_OPEN_BID_ASK:
          attrib.preOpen = attrMask & 4 != 0
  */
  let storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, price);

  this.requestIdEmit(requestId, 'tick', {
    tickType: tickType,
    value: price,
    mask: mask,
    ticker: storage,
  });

  // process ver 2 fields
  let sizeTickType = tickToSizeTick[tickType];
  if (sizeTickType) {
    applyTickerData(storage, sizeTickType, size);

    this.requestIdEmit(requestId, 'tick', {
      tickType: sizeTickType,
      value: size,
      ticker: storage
    });
  }
}



export function handler_TICK_SIZE(fields) {
  fields.shift();
  fields.shift();

  let requestId = parseInt(fields.shift());
  let tickType = parseInt(fields.shift());
  let size = parseInt(fields.shift());

  let storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, size);

  this.requestIdEmit(requestId, 'tickSize', {
    tickType: tickType,
    size: size,
    ticker: storage
  });
}



export function handler_TICK_GENERIC(fields) {
  fields.shift();
  fields.shift();
  let requestId = parseInt(fields.shift());
  let tickType = parseInt(fields.shift());
  let value = parseFloat(fields.shift());

  let storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, value);

  this.requestIdEmit(requestId, 'tick', {
    tickType: tickType,
    value: value,
    ticker: storage
  });
}



export function handler_TICK_STRING(fields) {
  fields.shift();
  fields.shift();
  let requestId = parseInt(fields.shift());
  let tickType = parseInt(fields.shift());
  let value = fields.shift();

  let storage = this.requestIdStorageMap(requestId);
  applyTickerData(storage, tickType, value);

  this.requestIdEmit(requestId, 'tick', {
    tickType: tickType,
    value: value,
    ticker: storage
  });
}




export function handler_TICK_SNAPSHOT_END(fields) {
  let requestId = parseInt(fields[2]);
  this.requestIdResolve(requestId, this.requestIdStorageMap(requestId));
}




export function handler_MARKET_DATA_TYPE(fields) {
  fields.shift();
  fields.shift();
  let requestId = parseInt(fields.shift());
  let marketDataType = parseInt(fields.shift());

  let storage = this.requestIdStorageMap(requestId);
  storage.marketDataType = marketDataType

  this.requestIdEmit(requestId, 'marketDataType', {
    marketDataType: marketDataType,
    ticker: storage
  });
}



export function handler_TICK_REQ_PARAMS(fields) {
  fields.shift();
  fields.shift();

  let requestId = parseInt(fields.shift());
  let minTick = parseFloat(fields.shift());
  let bboExchange = fields.shift();
  let snapshotPermissions = parseInt(fields.shift());

  this.requestIdEmit(requestId, 'reqParameters', {
    minTick: minTick,
    bboExchange: bboExchange,
    snapshotPermissions: snapshotPermissions
  });
}



export function handler_TICK_BY_TICK(fields) {
  fields.shift();
  let requestId = parseInt(fields.shift());
  let tickType = parseInt(fields.shift());
  let time = parseInt(fields.shift());

  if (tickType == 0) {
  } else if (tickType == 1 || tickType == 2) {
    // Last or AllLast
    let price = parseFloat(fields.shift());
    let size = parseInt(fields.shift());
    let mask = parseInt(fields.shift());

    /*
    tickAttribLast = TickAttribLast()
    tickAttribLast.pastLimit = mask & 1 != 0
    tickAttribLast.unreported = mask & 2 != 0*/
    let exchange = fields.shift();
    let specialConditions = fields.shift();

    this.requestIdEmit(requestId, 'tickByTick', {
      tickType: tickType,
      time: time,
      price: price,
      size: size,
      tickAttribLast: tickAttribLast,
      exchange: exchange,
      specialConditions: specialConditions
    });
  } else if (tickType == 3) {
    // BidAsk
    let bidPrice = parseFloat(fields.shift());
    let askPrice = parseFloat(fields.shift());
    let bidSize = parseInt(fields.shift());
    let askSize = parseInt(fields.shift());
    let mask = parseInt(fields.shift());
    /*
    tickAttribBidAsk = TickAttribBidAsk()
    tickAttribBidAsk.bidPastLow = mask & 1 != 0
    tickAttribBidAsk.askPastHigh = mask & 2 != 0
    */

    this.requestIdEmit(requestId, 'tickByTick', {
      time: time,
      bidPrice: bidPrice,
      askPrice: askPrice,
      bidSize: bidSize,
      askSize: askSize,
      mask: mask
    });
  } else if (tickType == 4) {
    // MidPoint
    let midPoint = parseFloat(fields.shift());

    this.requestIdEmit(requestId, 'tickByTick', {
      time: time,
      midPoint: midPoint
    });
  }
}



export function handler_TICK_OPTION_COMPUTATION(fields) {
  let version = parseInt(fields.shift());
  let requestId = parseInt(fields.shift());
  let tickTypeInt = parseInt(fields.shift());

  let impliedVol = parseFloat(fields.shift());
  let delta = parseFloat(fields.shift());
  let optPrice = null;
  let pvDividend = null;
  let gamma = null;
  let vega = null;
  let theta = null;
  let undPrice = null;

  if (impliedVol < 0) {   // -1 is the "not computed" indicator
    impliedVol = null;
  }
  if (delta == -2) {   // -2 is the "not computed" indicator
    delta = null;
  }

  if (version >= 6 ||
      tickTypeInt == TickType.MODEL_OPTION ||
      tickTypeInt == TickType.DELAYED_MODEL_OPTION) {
    optPrice = parseFloat(fields.shift());
    pvDividend = parseFloat(fields.shift());

    if (optPrice == -1) {   // -1 is the "not computed" indicator
      optPrice = null;
    }
    if (pvDividend == -1) {   // -1 is the "not computed" indicator
      pvDividend = null;
    }
  }

  if (version >= 6) {
    gamma = parseFloat(fields.shift());
    vega = parseFloat(fields.shift());
    theta = parseFloat(fields.shift());
    undPrice = parseFloat(fields.shift());

    if (gamma == -2) {   // -2 is the "not yet computed" indicator
      gamma = null;
    }
    if (vega == -2) {   // # -2 is the "not yet computed" indicator
      vega = null;
    }
    if (theta == -2) {   // -2 is the "not yet computed" indicator
      theta = null;
    }
    if (undPrice == -1) {   // -1 is the "not computed" indicator
      undPrice = null;
    }
  }

  let storage = this.requestIdStorageMap(requestId);
  storage.impliedVol = impliedVol;
  storage.delta = delta;
  storage.optPrice = optPrice;
  storage.pvDividend = pvDividend;
  storage.gamma = gamma;
  storage.vega = vega;
  storage.theta = theta;
  storage.undPrice = undPrice;
}
