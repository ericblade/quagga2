require('events').EventEmitter.prototype._maxListeners = 0;
require('core-js/es5');

const testsContext = require.context("./spec", true, /.*(t|j)sx?$/);
testsContext.keys().forEach(testsContext);

const componentsContext = require.context('../src/', true, /\.*(t|j)sx?$/);
componentsContext.keys().forEach(componentsContext);
