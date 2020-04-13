var path = require('path');
var webpack = require('webpack');

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai', 'sinon', 'sinon-chai'],
        files: [
            './node_modules/es6-promise/dist/es6-promise.auto.js',
            'test/test-main-integration.js',
            {pattern: 'test/integration/**/*.js', included: false},
            {pattern: 'test/fixtures/**/*.*', included: false},
        ],
        preprocessors: {
            'test/test-main-integration.js': ['webpack'],
        },
        webpack: {
            mode: 'production',
            entry: [
                './src/quagga.ts',
            ],
            module: {
                rules: [
                    {
                        test: /\.(t|j)sx?$/,
                        loader: 'babel-loader',
                    },
                ],
            },
            resolve: {
                extensions: ['.ts', '.tsx', '.js', '.jsx'],
                modules: [
                    path.resolve('./src/input/'),
                    path.resolve('./src/common/'),
                    'node_modules',
                ],
            },
            plugins: [
                new webpack.DefinePlugin({
                    ENV: require(path.join(__dirname, './configs/env/production')),
                }),
            ],
        },
        plugins: [
            'karma-phantomjs-launcher',
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-sinon-chai',
            require('karma-webpack'),
        ],
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO, // LOG_DEBUG
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true,
    });
};
