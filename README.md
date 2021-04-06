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

let api = new Client({
  host: '127.0.0.1',
  port: 4001
});

let time = await api.getCurrentTime();
console.log('current time: ' + time);
```

## Streaming methods:

```js
let contract = Contract.forex('EURUSD');

let e = await api.streamMarketData({
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


## Logging / debugging

Define
- `NODE_DEBUG=ib-tws-api` for debug info at logic level
- `NODE_DEBUG=ib-tws-api-bytes` for debug info at byte level

## Commands

Not all commands provided by API are implemented since I use it for
myself and I like to work only on something I use.
But most essential are.

Feel free to PR if you want to support more commands.

`async connect(parameters)` Connects to TWS/IB Gateway application
- `host`
- `port`
- `clientId` defaults to 1
- `timeoutMs` timeout in msec for request/response calls

`async getCurrentTime()` Asks the current system time on the server side

`streamMarketData(parameters)` Starts to stream market data.

`async getMarketDataSnapshot(p)` Returns market data snapshot.

`async reqMarketDataType(marketDataType)` The API can receive frozen market data
from Trader Workstation. Frozen market data is the last data recorded in our system.
During normal trading hours, the API receives real-time market data. If
you use this function, you are telling TWS to automatically switch to
frozen market data after the close. Then, before the opening of the next
trading day, market data will automatically switch back to real-time
market data.
- `marketDataType` 1 for real-time streaming market data or 2 for frozen market data

`streamTickByTickData(p)` Starts tick-by-tick streaming.
- `contract`
- `tickType`
- `numberOfTicks`: int
- `ignoreSize`

`placeOrder(p)` Place new order
- `contract`
- `order`

`async cancelOrder(orderId)` Cancel order

`async getOpenOrders()` Request the open orders that were placed from this client.
  The client with a clientId of 0 will also receive the TWS-owned
  open orders. These orders will be associated with the client and a new
  orderId will be generated. This association will persist over multiple
  API and TWS sessions

`async reqAutoOpenOrders(bAutoBind)` Call this function to request that newly created TWS orders
    be implicitly associated with the client. When a new TWS order is
    created, the order will be associated with the client.

    Note:  This request can only be made from a client with clientId of 0.

- `bAutoBind`: If set to TRUE, newly created TWS orders will be implicitly
    associated with the client. If set to FALSE, no association will be
    made.

`async getAllOpenOrders()` Call this function to request the open orders placed from all
      clients and also from TWS. No association is made between the returned orders and the
      requesting client.

`async reqGlobalCancel()` Cancel all open orders globally. It cancels both API and TWS open orders.

`reqAccountUpdates(p)` Start getting account values, portfolio

- `subscribe`:bool - If set to TRUE, the client will start receiving account
      and Portfoliolio updates. If set to FALSE, the client will stop
      receiving this information.
- `accountCode`:str -The account code for which to receive account and
      portfolio updates.

`async getPositions()` Returns real-time position data for all accounts.

`async cancelPositions()` Cancels real-time position updates.

`async getContractDetails(contract)` Download all details for a particular
  underlying.

- `contract`:Contract - The summary description of the contract being looked
      up.

`async getHistoricalData(p)` Requests contracts' historical data. When requesting historical data, a
  finishing time and date is required along with a duration string.

- `requestId`:TickerId - The id of the request. Must be a unique value. When the
      market data returns, it whatToShowill be identified by this tag. This is also
      used when canceling the market data.
- `contract`:Contract - This object contains a description of the contract for which
      market data is being requested.
- `endDateTime`:str - Defines a query end date and time at any point during the past 6 mos.
      Valid values include any date/time within the past six months in the format:
      yyyymmdd HH:mm:ss ttt

      where "ttt" is the optional time zone.
- `duration`:str - Set the query duration up to one week, using a time unit
      of seconds, days or weeks. Valid values include any integer followed by a space
      and then S (seconds), D (days) or W (week). If no unit is specified, seconds is used.
- `barSizeSetting`:str - Specifies the size of the bars that will be returned (within IB/TWS listimits).
      Valid values include:
      1 sec
      5 secs
      15 secs
      30 secs
      1 min
      2 mins
      3 mins
      5 mins
      15 mins
      30 mins
      1 hour
      1 day
- `whatToShow`:str - Determines the nature of data beinging extracted. Valid values include:
      TRADES
      MIDPOINT
      BID
      ASK
      BID_ASK
      HISTORICAL_VOLATILITY
      OPTION_IMPLIED_VOLATILITY
  useRth:int - Determines whether to return all data available during the requested time span,
      or only data that falls within regular trading hours. Valid values include:

      0 - all data is returned even where the market in question was outside of its
      regular trading hours.
      1 - only data within the regular trading hours is returned, even if the
      requested time span falls partially or completely outside of the RTH.
- `formatDate`: int - Determines the date format applied to returned bars. validd values include:

      1 - dates applying to bars returned in the format: yyyymmdd{space}{space}hh:mm:dd
      2 - dates are returned as a long integer specifying the number of seconds since
          1/1/1970 GMT.`

`async getHeadTimeStamp(p)` Note that formatData parameter affects intraday bars only
   1-day bars always return with date in YYYYMMDD format.
- `whatToShow`: str
- `useRth`: int
- `formatDate`: int

`async reqHistogramData(p)`
- `contract`: Contract,
- `useRth`: bool,
- `timePeriod`: str

`async getHistoricalTicks(p)`
- `contract`: Contract,
- `startDateTime`: str,
- `endDateTime`: str,
- `numberOfTicks`: int,
- `whatToShow`: str,
- `useRth`: int,
- `ignoreSize`: bool,
- `miscOptions`: TagValueList

`async reqScannerParameters()` Requests an XML string that describes all possible scanner queries.

`async getSecDefOptParams(p)` Requests security definition option parameters for viewing a
  contract's option chain requestId the ID chosen for the request
  underlyingSymbol futFopExchange The exchange on which the returned
  options are trading. Can be set to the empty string "" for all
  exchanges.

- `contract`: contract of the underlying security. conId has to be specified
- `futFopExchange`: str
- `exchange`: client-side filter of exchange of option's,
      since futFopExchange returns empty result when specified)



## Events

- `error (error)` on error
- `close` on connection closed
- `tick` on market data tick

## Contract shortcuts

- `Contract.forex('EURUSD')`
- `Contract.stock('AAPL')`
- `Contract.stock({symbol: 'AMD', conId: 4391})` - with extra fields

## Order shortcuts

- `Order.limit({action: 'BUY', totalQuantity: 1, lmtPrice: 0.01})`
- `Order.market({action: 'BUY', totalQuantity: 1})`
- `Order.stop({action: 'BUY', totalQuantity: 1, auxPrice: 0.01})`

# Consultancy & Development

I had to write that piece of code since I couldn't find acceptable Node.js client
for IB but it wasn't desirable to add python to the project stack.
Hope you won't have to repeat the same.

Feel free to contact me if you need some extra (paid) help with your software.

# Disclaimer

The software is provided on the conditions of the MIT license.

Best Regards,
Max Shaposhnikov <pub@maxicus.dev>
