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
        'sharp',
        'ndarray-pixels',
    ],
};
module.exports.target = 'node';
module.exports.resolve = {
    ...module.exports.resolve,
    // Prefer Node builds of packages (e.g., ndarray-pixels) instead of browser entries
    mainFields: ['main', 'module'],
    alias: {
        // Force ndarray-pixels to resolve to its Node build; webpack 4 lacks conditionNames support
        'ndarray-pixels$': 'ndarray-pixels/dist/ndarray-pixels-node.cjs',
    },
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
