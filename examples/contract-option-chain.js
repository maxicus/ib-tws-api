import { Client, Contract, Order } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001
  });

  var contractSearch = {
    symbol: 'IBM',
    secType: 'OPT',
    currency: 'USD',
    exchange: 'SMART',
    right: 'P',
    multiplier: 100
  };

  let details = await api.getContractDetails(contractSearch);
  console.log(details);
  console.log('put options found: ' + details.length);
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
