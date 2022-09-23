var webpack = require('webpack'),
    path = require('path');

const config = require('./webpack.config.js')();

module.exports = (env, argv) => {
    config.externals = [
        'get-pixels',
        'gl-matrix',
        'lodash',
        'ndarray',
        'ndarray-linear-interpolate',
    ];
    config.output.libraryTarget = 'commonjs';
    config.output.library = undefined;
    config.plugins = [
        new webpack.DefinePlugin({
            ENV: require(path.join(__dirname, './env/', process.env.BUILD_ENV)),
        }),
    ];
    config.output.path = __dirname + '/../lib';
    config.output.filename = 'quagga.js';
    config.mode = 'production';
    config.devtool = undefined;
    return config;
}
