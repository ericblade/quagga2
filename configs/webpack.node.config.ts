import * as webpack from 'webpack';
import * as path from 'path';
import config, { type ConfigurationFactory } from './webpack.config';

const Factory: ConfigurationFactory = (env, argv): webpack.Configuration => {
    const newConfig = config(env, argv);
    newConfig.externals = [
        'get-pixels',
        'gl-matrix',
        'lodash',
        'ndarray',
        'ndarray-linear-interpolate',
    ];
    newConfig.output = { ...newConfig.output, libraryTarget: 'commonjs', library: undefined };
    newConfig.plugins = [
        new webpack.DefinePlugin({
            ENV: require(path.join(__dirname, './env/', process.env.BUILD_ENV ?? 'development')),
        }),
    ];
    newConfig.output.path = __dirname + '/../lib';
    newConfig.output.filename = 'quagga.js';
    newConfig.mode = 'production';
    newConfig.devtool = undefined;
    return newConfig;
}

export default Factory;
