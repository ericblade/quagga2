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
const webpack = require('@cypress/webpack-preprocessor');
const fs = require('fs');
const path = require('path');

module.exports = (on, config) => {
    config.env = config.env || {};
    config.env.BUILD_ENV = 'production';
    // Resolve path to the temporary bundle test fixture
    const bundleFixturePath = path.resolve((config.projectRoot || process.cwd()), 'cypress/fixtures/bundle-test.html');

    // Expose cleanup tasks to the Cypress runner
    on('task', {
        deleteFile(filePath) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                return true;
            } catch (err) {
                // ENOENT is fine; any other error bubble up for visibility
                if (err && err.code === 'ENOENT') return true;
                throw err;
            }
        },
        cleanupBundleFixture() {
            try {
                if (fs.existsSync(bundleFixturePath)) {
                    fs.unlinkSync(bundleFixturePath);
                }
            } catch (_) {
                // Ignore errors during cleanup
            }
            return true;
        },
        fileExists(filePath) {
            return fs.existsSync(filePath);
        },
    });

    // Best-effort cleanup on process exit/interrupt, guarded to avoid duplicate handlers
    if (!global.__bundleCleanupHandlersRegistered) {
        const safeUnlink = () => {
            try {
                if (fs.existsSync(bundleFixturePath)) {
                    fs.unlinkSync(bundleFixturePath);
                }
            } catch (_) {}
        };
        process.on('exit', safeUnlink);
        process.on('SIGINT', () => { safeUnlink(); process.exit(1); });
        process.on('SIGTERM', () => { safeUnlink(); });
        global.__bundleCleanupHandlersRegistered = true;
    }
    
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        const webpackOptions = {
            webpackOptions: require('../../configs/webpack.config'),
            watchOptions: {},
        };
        on('file:preprocessor', webpack(webpackOptions));
    }
    
    // on('file:preprocessor', require('@cypress/code-coverage/use-babelrc'));
    return config;
};
