import assert from 'assert';



export default class Contract {
  static cfd(symbolOrData) {
    return Contract._toContract(symbolOrData, 'CFD', {
      currency: 'USD',
      exchange: 'SMART'
    });
  }



  static combo(symbolOrData) {
    return Contract._toContract(symbolOrData, 'BAG', {
      currency: 'USD',
      exchange: 'SMART'
    });
  };



  /* can be called as a pair forex('EURUSD')
     or
     forex({
       symbol: 'EUR',
       currency: 'USD'
     });
  */
  static forex(pairOrData) {
    if (typeof pairOrData == 'string') {
      assert(pairOrData.length == 6);

      pairOrData = {
        symbol: pairOrData.substr(0, 3),
        currency: pairOrData.substr(3)
      };
    }

    return Contract._toContract(pairOrData, 'CASH', {
      exchange: 'IDEALPRO'
    });
  };



  /*
  symbol:
  lastTradeDateOrContractMonth: The option's last trading day
      or contract month.

      * YYYYMM format: To specify last month
      * YYYYMMDD format: To specify last trading day
  */
  static future(data) {
    assert(data.symbol != null);
    assert(data.lastTradeDateOrContractMonth != null);

    return Contract._toContract(data, 'FUT', {
      currency: 'USD',
      exchange: 'ONE'
    });
  }



  /*
  symbol:
  lastTradeDateOrContractMonth: The option's last trading day
      or contract month.

      * YYYYMM format: To specify last month
      * YYYYMMDD format: To specify last trading day
  strike: option's strike
  right: Put or call option.
      Valid values are 'P', 'PUT', 'C' or 'CALL'.
  exchange: Destination exchange.
  multiplier:
  currency:
  */
  static futuresOption(data) {
    assert(data.symbol != null);
    assert(data.right != null);
    assert(data.lastTradeDateOrContractMonth != null);
    assert(data.strike != null);

    return Contract._toContract(data, 'FOP', {
      currency: 'USD',
      exchange: 'GLOBEX',
      multiplier: 50
    });
  }



  static index(symbolOrData) {
    return Contract._toContract(symbolOrData, 'IND', {
      currency: 'USD',
      exchange: 'CBOE'
    });
  }



  /*
  symbol:
  lastTradeDateOrContractMonth: The option's last trading day
      or contract month.

      * YYYYMM format: To specify last month
      * YYYYMMDD format: To specify last trading day
  strike: option's strike
  right: Put or call option.
      Valid values are 'P', 'PUT', 'C' or 'CALL'.
  exchange: Destination exchange.
  multiplier:
  currency:
  */
  static option(data) {
    assert(data.symbol != null);
    assert(data.right != null);
    assert(data.lastTradeDateOrContractMonth != null);
    assert(data.strike != null);

    return Contract._toContract(data, 'OPT', {
      currency: 'USD',
      exchange: 'SMART',
      multiplier: 100
    });
  }



  static stock(symbolOrData) {
    return Contract._toContract(symbolOrData, 'STK', {
      currency: 'USD',
      exchange: 'SMART'
    });
  };



  static _toContract(symbolOrData, secType, defaults) {
    if (typeof symbolOrData == 'string') {
      let c = {
        symbol: symbolOrData,
        secType: secType
      };
      for (let k in defaults) {
        c[k] = defaults[k];
      }

      return c;
    }

    assert(typeof symbolOrData.symbol == 'string');
    assert(!symbolOrData.secType);

    let c = {
      secType: secType
    };

    for (let k in defaults) {
      c[k] = defaults[k];
    }
    for (let k in symbolOrData) {
      c[k] = symbolOrData[k];
    }

    return c;
  }
}
