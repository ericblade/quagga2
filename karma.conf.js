var path = require('path');
var webpack = require('webpack');

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['source-map-support', 'mocha', 'chai', 'sinon', 'sinon-chai'],
        files: [
            './node_modules/es6-promise/dist/es6-promise.auto.js',
            'test/test-main.js',
            {pattern: 'test/spec/**/*.js', included: false},
        ],
        preprocessors: {
            'test/test-main.js': ['webpack'],
        },
        webpack: {
            mode: 'development',
            node: {
                fs: 'empty',
            },
            entry: [
                './test/test-main.js',
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
                    path.resolve('./test/mocks/'),
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
            'karma-coverage',
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-sinon-chai',
            'karma-source-map-support',
            require('karma-webpack'),
        ],
        reporters: ['progress', 'coverage'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true,
        coverageReporter: {
            type: 'html',
            dir: 'coverage/',
        },
    });
};
