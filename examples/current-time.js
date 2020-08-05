import { Client } from '../index.js';



async function run() {
  let api = new Client({
    host: '127.0.0.1',
    port: 4001,
  });

  let time = await api.getCurrentTime();
  console.log('current time: ' + time);
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
