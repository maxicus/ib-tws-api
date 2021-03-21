import assert from 'assert';

interface SymbolData {
  symbol: string;
}

interface FutureData extends SymbolData {
  lastTradeDateOrContractMonth: string;
}

interface OptionData extends SymbolData {
  right: string;
  lastTradeDateOrContractMonth: string;
  strike: string;
}

interface ForexData {
  symbol: string;
  currency: string;
}

export class Contract {

  static cfd(symbolOrData: SymbolData | string) {
    if (typeof symbolOrData === 'string') { symbolOrData = { symbol: symbolOrData }; }
    return {
      secType: 'CFD',
      currency: 'USD',
      exchange: 'SMART',
      ...symbolOrData
    }
  }

  static combo(symbolOrData: SymbolData | string) {
    if (typeof symbolOrData === 'string') { symbolOrData = { symbol: symbolOrData }; }
    return {
      secType: 'BAG',
      currency: 'USD',
      exchange: 'SMART',
      ...symbolOrData
    };
  };

  static forex(pairOrData: ForexData | string) {
    if (typeof pairOrData === 'string') {
      pairOrData = {
        symbol: pairOrData.substr(0, 3),
        currency: pairOrData.substr(3)
      };
    }
    return {
      secType: 'CASH',
      exchange: 'IDEALPRO',
      ...pairOrData
    };
  };

  static future(data: FutureData) {
    return {
      secType: 'FUT',
      currency: 'USD',
      exchange: 'ONE',
      ...data
    };
  }

  static futuresOption(data: OptionData) {
    return {
      secType: 'FOP',
      currency: 'USD',
      exchange: 'GLOBEX',
      multiplier: 50,
      ...data
    };
  }

  static index(symbolOrData: SymbolData | string) {
    if (typeof symbolOrData === 'string') { symbolOrData = { symbol: symbolOrData }; }
    return {
      secType: 'IND',
      currency: 'USD',
      exchange: 'CBOE',
      ...symbolOrData
    };
  }

  static option(data: OptionData) {
    return {
      secType: 'OPT',
      currency: 'USD',
      exchange: 'SMART',
      multiplier: 100,
      ...data
    };
  }

  static stock(symbolOrData: SymbolData | string) {
    if (typeof symbolOrData === 'string') { symbolOrData = { symbol: symbolOrData }; }
    return {
      secType: 'STK',
      currency: 'USD',
      exchange: 'SMART',
      ...symbolOrData
    };
  };
}
