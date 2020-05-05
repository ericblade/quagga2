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

const task = require('@cypress/code-coverage/task');
console.warn('* task=', task);
/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
    config.env = config.env || {};
    config.env.BUILD_ENV = 'production';
    on('task', task(on, config));
    return config;
};
