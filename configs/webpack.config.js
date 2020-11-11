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
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: [
            path.resolve('./src'),
            'node_modules',
        ],
    },
    node: {
        fs: 'empty',
    },
    output: {
        path: __dirname + '/../dist',
        publicPath: '/',
        libraryTarget: 'umd',
        libraryExport: 'default',
        library: 'Quagga',
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
        new webpack.NormalModuleReplacementPlugin(/..\/input\/frame_grabber/, '../input/frame_grabber_browser'),
        new webpack.NormalModuleReplacementPlugin(/..\/input\/input_stream\/input_stream/, '../input/input_stream/input_stream_browser'),
    ],
    optimization: {
        minimize: false,
    },
    mode: 'production',
};
