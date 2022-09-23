const webpack = require('webpack');
const config = require('./webpack.config.js')();

module.exports = (env, argv) => {

    config.plugins = config.plugins.concat([
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
        }),
    ]);

    config.optimization.minimize = true;
    config.output.filename = 'quagga.min.js';

    config.output.sourceMapFilename = '';
    config.devtool = undefined;
    config.mode = 'production';
    return config;
}
