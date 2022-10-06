import * as webpack from 'webpack';
import config, { type ConfigurationFactory } from './webpack.config';

const Factory: ConfigurationFactory = (env, argv): webpack.Configuration => {
    const newConfig = config(env, argv);
    const additionalPlugins = [new webpack.LoaderOptionsPlugin({ minimize: true, debug: false })];
    newConfig.plugins = [...newConfig.plugins ?? [], ...additionalPlugins];

    newConfig.optimization = { ...newConfig.optimization, minimize: true };
    newConfig.output = { ...newConfig.output, filename: 'quagga.min.js', sourceMapFilename: '' };

    newConfig.devtool = undefined;
    newConfig.mode = 'production';
    return newConfig;
};

export default Factory;
