import { Client, Contract, Order } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001
  });

  let details = await api.getHistoricalTicks({
    contract: Contract.stock('AAPL'),
    startDateTime: '20200608 11:00:00',
    numberOfTicks: 1000,
    whatToShow: 'TRADES',
    useRth: 1
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
