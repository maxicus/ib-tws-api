import assert from 'assert';



export default class Contract {
  static limit(data) {
    assert(data.action);
    assert(data.totalQuantity > 0);
    assert(data.lmtPrice > 0);

    return Contract._toOrder(data, 'LMT', {
      transmit: true,
      openClose: 'O',
	    tif: 'DAY',
      /*
      origin: 0,
      parentId: 0,
      blockOrder: 0,
      sweepToFill: 0,
      displaySize: 0,
      triggerMethod: 0,
      outsideRth: 0,
      hidden: 0,
      discretionaryAmt: 0,
      shortSaleSlot: 0,
      exemptCode: -1,
      ocaType: 0,
      allOrNone: 0,
      eTradeOnly: 1,
      firmQuoteOnly: 1,
      auctionStrategy: 0,
      overridePercentageConstraints: 0,
      continuousUpdate: 0,
      optOutSmartRouting: 0,
      notHeld: 0,
      whatIf: 0,
      solicited: 0,
      randomizeSize: 0,
      randomizePrice: 0,
      extOperator: 0,
      mifid2ExecutionAlgo: 0,*/
    });
  }



  static market(data) {
    assert(data.action);
    assert(data.totalQuantity > 0);

    return Contract._toOrder(data, 'MKT', {
      transmit: true,
      goodAfterTime: '',
      goodTillDate: ''
    });
  }



  static stop(data) {
    assert(data.action);
    assert(data.totalQuantity > 0);
    assert(data.auxPrice > 0);

    return Contract._toOrder(data, 'STP', {
      transmit: true,
      parentId: 0,
      tif: 'DAY'
    });
  }



  static _toOrder(data, orderType, defaults) {
    assert(!data.orderType);

    let o = {
      orderType: orderType
    };

    for (let k in defaults) {
      o[k] = defaults[k];
    }
    for (let k in data) {
      o[k] = data[k];
    }

    return o;
  }
}
