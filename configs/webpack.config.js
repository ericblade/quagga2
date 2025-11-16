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
                test: /\.js$/,
                include: path.resolve('./node_modules/sinon'),
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['@babel/preset-env', {
                            targets: { browsers: ['last 2 versions'] }
                        }]
                    ],
                    plugins: [
                        '@babel/plugin-proposal-optional-chaining',
                        '@babel/plugin-proposal-nullish-coalescing-operator'
                    ]
                }
            },
            {
                test: /\.(t|j)sx?$/,
                exclude: /node_modules/,
                use: { loader: 'babel-loader' },
            },
            {
                enforce: 'pre',
                test: /\.(t|j)sx?$/,
                exclude: /node_modules/,
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
        new webpack.NormalModuleReplacementPlugin(/..\/input\/frame_grabber/, '../input/frame_grabber_browser.js'),
        new webpack.NormalModuleReplacementPlugin(/input_stream[/\\]input_stream$/, (resource) => {
            resource.request = resource.request.replace(/input_stream$/, 'input_stream_browser');
        }),
    ],
    optimization: {
        minimize: false,
    },
    mode: 'production',
};
