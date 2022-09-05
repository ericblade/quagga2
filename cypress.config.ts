import { defineConfig } from 'cypress';
import plugin from './cypress/plugins/index';

export default defineConfig({
  video: false,
  screenshotOnRunFailure: false,
  trashAssetsBeforeRuns: true,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // return plugin(on, config)
    },
  },
})
