# Integration Tests

## Test Infrastructure

This directory contains integration tests for Quagga2's barcode decoder functionality.

### Test Behavior

By default, all decoder tests **must pass in both Node and browser environments**. If a test fails, the entire test run fails, alerting developers to regressions.

For tests that are known to fail in specific environments, you can use environment-specific flags to mark them explicitly.

### Test Helper: `it.allowFail()`

The `it.allowFail()` helper is used internally when a test is marked with environment-specific failure flags. When a test fails in an allowed environment, it will be marked as "pending" instead of causing the test run to fail.

### Marking Tests with Environment-Specific Flags

In the test data structures, you can mark individual test cases with explicit environment-specific failure policies:

- **`allowFailInNode: true`**: Test can fail in Node environment without failing the build
- **`allowFailInBrowser: true`**: Test can fail in browser environment without failing the build
- **Both flags**: Test can fail in both environments - set both flags explicitly

```typescript
runDecoderTest('code_128', generateConfig(), [
    // This test passes everywhere - no flags needed, will fail build if it breaks
    { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },
    
    // This test passes in Node but fails in browser - use allowFailInBrowser only
    { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128', allowFailInBrowser: true },
    
    // This test fails in both environments - set BOTH flags explicitly
    { 'name': 'failing-test.jpg', 'result': '123456', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
]);
```

## Current Test Status

As of the latest update:
- **185 tests passing in Node** (will fail the build if they break)
- **26 tests marked with both `allowFailInNode` and `allowFailInBrowser`** (can fail in both environments)
- **2 tests marked with `allowFailInBrowser` only** (must pass in Node, can fail in browser)

### Tests marked with both allowFailInNode and allowFailInBrowser:
- **code_39**: 2 tests (image-005, image-011)
- **code_39_vin**: 8 tests (image-002, 003, 004, 005, 007, 008, 009, 010)
- **code_32**: 5 tests (image-2, 3, 6, 7, 8)
- **ean_8**: 1 test (image-004 - gets wrong result)
- **codabar**: 1 test (image-008)
- **External Reader code_128**: 1 test (image-004)

### Tests marked with `allowFailInBrowser` only:
- **code_128**: 2 tests (image-003, image-004 - pass in Node, fail in browser)

### Decoders with all tests passing (no failure flags):
- ✅ ean (10 tests)
- ✅ ean_extended (10 tests)
- ✅ upc (10 tests)
- ✅ upc_e (10 tests)
- ✅ i2of5 (5 tests)
- ✅ 2of5 (10 tests)
- ✅ code_93 (11 tests)

## Running Tests

```bash
# Run node integration tests
npm run test:node

# Run browser tests (requires Cypress)
npm run test:browser-all
```

## Adding New Tests

When adding new decoder test cases:

1. Add the test data to the appropriate `runDecoderTest()` call **without** any flags
2. Run the tests in both Node and browser environments
3. Based on the results, add explicit flags:
   - **Passes everywhere**: Leave without flags
   - **Fails only in Node**: Add `allowFailInNode: true`
   - **Fails only in browser**: Add `allowFailInBrowser: true`
   - **Fails in both**: Add **both** `allowFailInNode: true` and `allowFailInBrowser: true`

Example:
```typescript
runDecoderTest('my_decoder', generateConfig(), [
    // Passes everywhere - no flags needed
    { 'name': 'working-image.jpg', 'result': '123456', format: 'my_format' },
    
    // Passes in Node, fails in browser - set allowFailInBrowser only
    { 'name': 'browser-issue.jpg', 'result': '789012', format: 'my_format', allowFailInBrowser: true },
    
    // Fails in both environments - set BOTH flags explicitly
    { 'name': 'problematic-image.jpg', 'result': '345678', format: 'my_format', allowFailInNode: true, allowFailInBrowser: true },
]);
```

## Fixing Failing Tests

When you fix a test that was marked with failure flags:

**For tests with both `allowFailInNode` and `allowFailInBrowser`:**
1. Remove both flags from the test
2. Verify the test passes consistently in both Node and browser environments
3. The test will now fail the build if it breaks in either environment

**For tests with `allowFailInBrowser` only:**
1. Fix the browser-specific issue
2. Remove the `allowFailInBrowser: true` flag
3. Verify the test passes in both Node and browser
4. The test will now fail the build if it breaks in either environment

**For tests with `allowFailInNode` only:**
1. Fix the Node-specific issue
2. Remove the `allowFailInNode: true` flag
3. Verify the test passes in both Node and browser
4. The test will now fail the build if it breaks in either environment

## Design Philosophy

The default behavior is "tests must pass in both environments" to catch regressions early. Environment-specific failure flags provide explicit control:

- **Regressions are caught immediately** - If a working test breaks, the build fails
- **Environment-specific exceptions** - Tests can be marked to allow failure in specific environments only
- **No implicit behavior** - Flags must be set explicitly for each environment
- **Clear intent** - Flags clearly indicate which environments have known issues

## Browser vs Node Differences

CI runs integration tests in **both Cypress (browser) and ts-node (Node.js)**. Some tests behave differently between these environments, which is being investigated.

### Test Failure Handling

- **`allowFailInNode: true`**: Test can fail in Node environment without failing CI
- **`allowFailInBrowser: true`**: Test can fail in browser environment without failing CI
- **Both flags together**: Test can fail in both environments without failing CI

### Current Known Differences

**Tests that fail in browser but pass in Node** (using `allowFailInBrowser` only):
- code_128 image-003, image-004

**Tests that fail in both environments** (using both `allowFailInNode` and `allowFailInBrowser`):
- code_39 image-005, image-011
- code_39_vin image-002, 003, 004, 005, 007, 008, 009, 010
- code_32 image-2, 3, 6, 7, 8
- ean_8 image-004
- codabar image-008
- External Reader code_128 image-004

This separation ensures that regressions in Node tests are caught immediately, even for tests that are known to fail in browser.
