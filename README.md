Another node.js API client for [Interactive Brokers](http://interactivebrokers.com/) TWS / IB Gateway.
ES6 module this time and supports async/await syntax.
No dependencies.

Code is based on official API, python version which can be found [here](https://interactivebrokers.github.io/).


# Installation

    $ npm install ib-tws-api

Explore examples [here](https://github.com/maxicus/ib-tws-api/tree/master/examples).

# Usage

## Request/response methods:

```js
import { Client } from 'ib-tws-api';

let api = new Client();

await api.connect({
  host: '127.0.0.1',
  port: 4001
})

let time = await api.getCurrentTime();
console.log('current time: ' + time);
```

## Streaming methods:

```js
let contract = Contract.forex('EURUSD');

let e = api.streamMarketData({
  contract: contract
});

e.on('tick', (t) => {
  console.log(t.ticker);
});

e.on('error', (e) => {
  console.log('error');
  console.log(e);
});

setTimeout(() => {
  e.stop();
  console.log('shut down streaming');
}, 10000);
```


## Commands

Not all commands provided API itself are implemented since I use it for
myself and don't like to waste time on something I don't use.
But most essential are.

Feel free to PR if you need something extra.

## Events

`error (error)` on error
`close` on connection closed
`tick` on market data tick

## Contract shortcuts

`Contract.forex('EURUSD')`
`Contract.stock('AAPL')`
`Contract.stock({symbol: 'AMD', conId: 4391})` - with extra fields

## Order shortcuts

`Order.limit({action: 'BUY', totalQuantity: 1, lmtPrice: 0.01})`

# Consultancy & Development

I had to write that piece of code since I couldn't find acceptable Node.js client
for IB but it wasn't desirable to add python to the project stack.
Hope you won't have to repeat the same.

Feel free to contact me if you need something extra.


# Disclaimer

The software is provided on the conditions of the MIT license.

:author: Max Shaposhnikov <pub@maxicus.dev>
