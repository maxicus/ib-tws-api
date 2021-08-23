import { Client, Contract } from '../index.js';

const api = new Client({
  host: '127.0.0.1',
  port: 7496,
});



try {
  const put = Contract.option({
    symbol: 'GOOG',
    lastTradeDateOrContractMonth: '20230616',
    strike: 2700,
    right: 'P',
  });
  const call = { ...put, right: 'C' };
  const straddle = await api.createCombo([
    [1, put],
    [1, call],
  ]);
  console.log('Straddle:', straddle);
  process.exit(0);
} catch (e) {
  console.error('ERROR:', e.message);
  process.exit(1);
}
