import { Client, Contract, Order } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001
  });

  let details = await api.getHistoricalData({
    contract: Contract.stock('AAPL'),
    endDateTime: '20200308 12:00:00',
    duration: '1 D',
    barSizeSetting: '1 min',
    whatToShow: 'TRADES',
    useRth: 1,
    formatDate: 1
  });
  console.log(details);
}



run()
  .then(() => {
    console.log('finish');
    process.exit();
  })
  .catch((e) => {
    console.log('failure');
    console.log(e);
    process.exit();
  });
