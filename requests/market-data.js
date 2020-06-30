import assert from 'assert';
import OutcomeMessageType from '../const-outcome-message-type.js';
import ServerVersion from '../const-server-version.js';



export function request_mktData(serverVersion, p) {
  /* Call this function to request market data. The market data
  will be returned by the tickPrice and tickSize events.

  requestId: TickerId - The ticker id. Must be a unique value. When the
      market data returns, it will be identified by this tag. This is
      also used when canceling the market data.
  contract:Contract - This structure contains a description of the
      Contractt for which market data is being requested.
  genericTickList:str - A commma delimited list of generic tick types.
      Tick types can be found in the Generic Tick Types page.
      Prefixing w/ 'mdoff' indicates that top mkt data shouldn't tick.
      You can specify the news source by postfixing w/ ':<source>.
      Example: "mdoff,292:FLY+BRF"
  snapshot:bool - Check to return a single snapshot of Market data and
      have the market data subscription cancel. Do not enter any
      genericTicklist values if you use snapshots.
  regulatorySnapshot: bool - With the US Value Snapshot Bundle for stocks,
      regulatory snapshots are available for 0.01 USD each.
  mktDataOptions:TagValueList - For internal use only. */
  assert(p.requestId > 0);

  if (serverVersion < ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL) {
    if (contract.deltaNeutralContract) {
      throw new Error("It does not support delta-neutral orders.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_REQ_MKT_DATA_CONID) {
    if (contract.conId > 0) {
      throw new Error("It does not support conId parameter.");
    }
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
    if (contract.tradingClass) {
      throw new Error("It does not support tradingClass parameter in reqMktData.");
    }
  }

  const VERSION = 11;

  // send req mkt data msg
  let flds = [OutcomeMessageType.REQ_MKT_DATA, VERSION, p.requestId];

  // send contract fields
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_REQ_MKT_DATA_CONID) {
    flds.push(p.contract.conId);
  }

  flds.push(p.contract.symbol);
  flds.push(p.contract.secType);
  flds.push(p.contract.lastTradeDateOrContractMonth);
  flds.push(p.contract.strike);
  flds.push(p.contract.right);
  flds.push(p.contract.multiplier);   // srv v15 and above
  flds.push(p.contract.exchange);
  flds.push(p.contract.primaryExchange);   // srv v14 and above
  flds.push(p.contract.currency);
  flds.push(p.contract.localSymbol);   // srv v2 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_TRADING_CLASS) {
    flds.push(p.contract.tradingClass);
  }

  // Send combo legs for BAG requests (srv v8 and above)
  if (p.contract.secType == "BAG" && p.contract.comboLegs.length > 0) {
    comboLegsCount = p.contract.comboLegs.length;
    flds.push(comboLegsCount);
    p.contract.comboLegs.forEach((comboLeg) => {
      flds.push(comboLeg.conId);
      flds.push(comboLeg.ratio);
      flds.push(comboLeg.action);
      flds.push(comboLeg.exchange);
    });
  }

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_DELTA_NEUTRAL) {
    if (p.contract.deltaNeutralContract) {
      flds.push(true);
      flds.push(p.contract.deltaNeutralContract.conId);
      flds.push(p.contract.deltaNeutralContract.delta);
      flds.push(p.contract.deltaNeutralContract.price);
    } else {
      flds.push(false);
    }
  }

  flds.push(p.genericTickList);   // srv v31 and above
  flds.push(p.snapshot);   // srv v35 and above

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_REQ_SMART_COMPONENTS) {
    flds.push(p.regulatorySnapshot);
  }

  // send mktDataOptions parameter
  if (serverVersion >= ServerVersion.MIN_SERVER_VER_LINKING) {
    //current doc says this part if for "internal use only" -> won't support it
    /*
    if (mktDataOptions) {
      throw Error("not supported");
    }*/
    flds.push("");
  }

  return flds;
}



export function request_tickByTickData(serverVersion, p) {
  /*
  contract: Contract,
  tickType: str,
  numberOfTicks: int,
  ignoreSize: bool

  returns requestId
  */
  if (serverVersion < ServerVersion.MIN_SERVER_VER_TICK_BY_TICK) {
    throw new Error("It does not support tick-by-tick data requests.");
  }

  if (serverVersion < ServerVersion.MIN_SERVER_VER_TICK_BY_TICK_IGNORE_SIZE) {
    throw new Error("It does not support ignoreSize and numberOfTicks parameters " +
      "in tick-by-tick data requests.");
  }

  let msg = [
    OutcomeMessageType.REQ_TICK_BY_TICK_DATA,
    p.requestId,
    p.contract.conId,
    p.contract.symbol,
    p.contract.secType,
    p.contract.lastTradeDateOrContractMonth,
    p.contract.strike,
    p.contract.right,
    p.contract.multiplier,
    p.contract.exchange,
    p.contract.primaryExchange,
    p.contract.currency,
    p.contract.localSymbol,
    p.contract.tradingClass,
    p.tickType
  ];

  if (serverVersion >= ServerVersion.MIN_SERVER_VER_TICK_BY_TICK_IGNORE_SIZE) {
    msg.push(p.numberOfTicks);
    msg.push(p.ignoreSize);
  }

  return msg;
}



export function request_cancelTickByTickData(serverVersion, requestId) {
  if (serverVersion < ServerVersion.MIN_SERVER_VER_TICK_BY_TICK) {
    throw new Error("It does not support tick-by-tick data requests.");
  }

  return [
    OutcomeMessageType.CANCEL_TICK_BY_TICK_DATA,
    requestId
  ];
}
