var webpack = require('webpack'),
    path = require('path');

const baseConfig = require('./webpack.config.js');

module.exports = {
    ...baseConfig,
    externals: [
        'fs',
        'http',
        'https',
        'url',
    ],
};
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
