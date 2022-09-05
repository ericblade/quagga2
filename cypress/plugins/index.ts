/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
*/
// const webpack = require('@cypress/webpack-preprocessor');
import webpackPreprocessor from '@cypress/webpack-preprocessor';
import webpackconfig from '../../configs/webpack.config';

console.warn(JSON.stringify(webpackconfig));
process.exit();

module.exports = (on, config) => {
    config.env = config.env || {};
    config.env.BUILD_ENV = 'production';
    // if (process.env.NODE_ENV === 'test') {
/*         const webpackOptions = {
            webpackOptions: webpackconfig(),
            // webpackOptions: testconfig,
            watchOptions: {},
        };
 */
    on('file:preprocessor');
        // on('file:preprocessor', webpack());
        // require('@cypress/code-coverage/task')(on, config);
    // }
    // on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));
    return config;
};

export default module.exports;
