var webpack = require('webpack'),
    path = require('path');

module.exports = {
    entry: [
        './src/quagga.js',
    ],
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(t|j)sx?$/,
                use: { loader: 'babel-loader' },
            },
            {
                enforce: 'pre',
                test: /\.(t|j)sx?$/,
                loader: 'source-map-loader',
            },
        ],
    },
    resolve: {
        modules: [
            path.resolve('./src/input/'),
            path.resolve('./src/common/'),
            'node_modules',
        ],
    },
    output: {
        path: __dirname + '/../dist',
        publicPath: '/',
        libraryTarget: 'umd',
        library: 'quagga',
        filename: 'quagga.js',
    },
    devServer: {
        contentBase: './',
        hot: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            ENV: require(path.join(__dirname, './env/', process.env.BUILD_ENV)),
        }),
    ],
    optimization: {
        minimize: false,
    },
    mode: 'production',
};
