import * as webpack from 'webpack';
import * as path from 'node:path';
// TODO: There's no actual reason to have the dev server is there?  We should be able to just remove the options and prune the package?
import 'webpack-dev-server';

export type ConfigurationFactory = (env: Record<string, any>, args: Record<string, any>) => webpack.Configuration;

const defaultConfig: webpack.Configuration = {
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
        fallback: {
            fs: false,
        }
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
        hot: true,
    },
    plugins: [
        new webpack.DefinePlugin({
            ENV: require(path.join(__dirname, './env/', process.env.BUILD_ENV ?? 'development')),
        }),
        new webpack.NormalModuleReplacementPlugin(/..\/input\/frame_grabber/, '../input/frame_grabber_browser'),
        new webpack.NormalModuleReplacementPlugin(/^..\/input\/input_stream\/input_stream/, '../input/input_stream/input_stream_browser'),
    ],
    optimization: {
        minimize: false,
    },
    mode: 'development',
};

const Factory: ConfigurationFactory = (env, argv) => {
    return defaultConfig;
};

export default Factory;
