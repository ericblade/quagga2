var webpack = require('webpack'),
    path = require('path');

module.exports = require('./webpack.config.js');

module.exports.externals = [
    'get-pixels',
    'gl-matrix',
    'lodash',
    'ndarray',
    'ndarray-linear-interpolate',
];
module.exports.output.libraryTarget = 'commonjs';
module.exports.output.library = undefined;
module.exports.plugins = [
    new webpack.DefinePlugin({
        ENV: require(path.join(__dirname, './env/', process.env.BUILD_ENV)),
    }),
];
module.exports.devtool = undefined;
module.exports.output.path = __dirname + '/../lib';
module.exports.output.filename = 'quagga.js';
