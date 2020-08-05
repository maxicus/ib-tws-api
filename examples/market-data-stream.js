import { Client, Contract } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001
  });

  //let contract = Contract.stock('AAPL');
  let contract = Contract.forex('EURUSD');

  let e = await api.streamMarketData({
    contract: contract
  });

  e.on('tick', (t) => {
    console.log(t.ticker);
  });

  e.on('error', (t) => {
    console.log('error');
    console.log(t);
  });

  setTimeout(() => {
    e.stop();
    console.log('shut down streaming');
  }, 10000);
}



run()
  .catch((e) => {
    console.log('failure');
    console.log(e);
    process.exit();
  });
