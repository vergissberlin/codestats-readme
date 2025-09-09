import * as bars from 'bars';

// customized
var data = {
  ferrets: 20,
  cats: 12,
  dogs: 30,
  koalas: 3,
};

// Add data
var addData = {
  dirk: 12,
  sven: 42,
  ole: 30,
  susan: 3,
};

data = Object.assign(data, addData);

// Add data with dynamic keys
var myDynamicKey = 'thisIsDynamic';
var addDataDynamic = {
  [myDynamicKey]: 24,
};

data = Object.assign(data, addDataDynamic);

console.log(bars(data, { bar: '█', width: 40, sort: true, limit: 2 }));
