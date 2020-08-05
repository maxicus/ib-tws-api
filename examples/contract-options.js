import { Client, Contract, Order } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001,
  });

  let details = await api.getSecDefOptParams({
    contract: Contract.stock({symbol: 'AMD', conId: 4391})
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
