## Contributing {#contributing}

### Questions, Bugs, Enhancements / Suggestions {#questions-bugs-enhancements}

For questions, bug reports, and enhancement requests / suggestions, please use the GitHub issue
tracker at https://github.com/ericblade/quagga2/issues

### Chat / Real Time Communication? {#chat}

We have a Gitter chat channel available at https://gitter.im/quaggaJS/Lobby . Please join us there,
and be patient.  Thanks!

### Code {#code}

#### Developing enhancements to Quagga2 {#developing-enhancements}

If you'd like to work directly on the Quagga2 code, it is quite easy to build a local development
copy and get started hacking on the base code.  Simply clone this repository, then run:

```
npm install
npm run build
```

#### Running tests {#running-tests}

There are several tests included in Quagga2, in the test/ folder.  Please make sure before you
send in any pull requests, that you have run ```npm test``` against the existing tests, as well as
implemented any tests that may be needed to test your new code.  If you're not sure how to properly
unit test your new code, then go ahead and make that pull request, and we'll try to help you before
merging.

**Test Structure**:

- Unit tests are in `src/` alongside source files (`.spec.ts` files)
- Integration tests are in `test/integration/` organized by decoder type
- See `test/integration/README.md` for detailed information about integration test structure and configuration

**Running Specific Tests**:

```bash
# All tests (Node unit/integration + full Cypress suite)
npm test

# Run Node and Cypress in parallel (faster local iteration)
npm run test:parallel

# Node tests only
npm run test:node

# Browser tests only (requires Cypress)
npm run test:browser-all

# E2E examples spec with server (headless)
npm run test:e2e

# E2E examples spec (interactive, Electron)
npm run test:e2e:open

# Cypress: run only specific spec(s)
# Pass --spec through npm using --
npm run cypress:run -- --spec cypress/e2e/browser.cy.ts

# Multiple specs (comma-separated)
npm run cypress:run -- --spec cypress/e2e/browser.cy.ts,cypress/e2e/integration.cy.ts

# Glob pattern
npm run cypress:run -- --spec "cypress/e2e/**/browser*.cy.ts"

# Open interactive runner
npm run cypress:open

# Open only the examples E2E spec (Electron)
npm run cypress:open:e2e

# Choose a browser (if installed)
npx cross-env NODE_ENV=development BUILD_ENV=development NODE_OPTIONS=--openssl-legacy-provider cypress run --browser chrome --env BUILD_ENV=development --spec cypress/e2e/browser.cy.ts

# Integration tests only (Node)
npx ts-mocha -p test/tsconfig.json test/integration/**/*.spec.ts

# Specific decoder integration tests
npx ts-mocha -p test/tsconfig.json test/integration/decoders/ean_8.spec.ts
```

**Adding Integration Tests**:

When adding new test cases to decoder integration tests, tests should pass in both Node and browser
environments by default. If a test is known to fail in a specific environment, mark it explicitly with:

- `allowFailInNode: true` - Test can fail in Node without failing CI
- `allowFailInBrowser: true` - Test can fail in browser without failing CI
- Both flags - Test can fail in both environments

See `test/integration/README.md` for complete details on the test failure marking system.

**Notes**:

- The Cypress E2E examples (`cypress/e2e/examples.cy.ts`) require the local examples server on port 8080; the `test`, `test:e2e`, and `test:e2e:open` scripts start it automatically via `start-server-and-test`.
- The parallel runner uses prefixed logs (`e2e`, `node`) and exits non-zero if either side fails (`--kill-others-on-fail --success=all`).

#### Working on a changed copy of Quagga2 from another repository (ie, developing an external plugin) {#working-on-external-plugin}

If you need to make changes to Quagga2 to support some external code (such as an external reader plugin),
you will probably need to be able to test the code in your other repo.  One such way to do that is
to ```npm install @ericblade/quagga2``` inside the external repo, which will initialize the module
structure, and fill it with the current release of quagga2.  Once that is completed, then copy the
lib/quagga.js (node) and/or dist/quagga.js and/or dist/quagga.min.js files into
ExternalRepo/node_modules/@ericblade/quagga2, preserving the "lib" or "dist" folder. Then your code
will have the new changes that you have implemented in your copy of the quagga2 repo.

#### Pull requests {#pull-requests}

Please, submit pull requests! Open source works best when we all work together.  If you find a change
to be useful, the odds are that other users will, as well!

## BE AWESOME {#be-awesome}

Don't forget to BE AWESOME.
