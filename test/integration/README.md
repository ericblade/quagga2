# Integration Tests

## Test Infrastructure

This directory contains integration tests for Quagga2's barcode decoder functionality.

### Test Helpers

#### `it.allowFail()`

Used for tests that may fail but should not block the test suite. When a test fails, it will be marked as "pending" instead of causing the test run to fail.

**Usage:**
```typescript
it.allowFail('test that might fail', async function() {
    // test code
});
```

This is useful for:
- Tests inherited from the original codebase that are known to fail
- Tests for features that are work-in-progress
- Tests with non-deterministic failures

#### `it.mustPass()` ✨ NEW

Used for tests that are known to pass consistently and should fail if they stop working. When a test fails, it will be reported as a failure, alerting developers that something has broken.

**Usage:**
```typescript
it.mustPass('test that must always pass', async function() {
    // test code
});
```

This is useful for:
- Regression testing - ensuring known-good functionality stays working
- Critical functionality that must not break
- Tests that have been verified to work consistently

### Marking Tests with `mustPass`

In the test data structures, you can mark individual test cases with `mustPass: true`:

```typescript
runDecoderTest('ean', generateConfig(), [
    { 'name': 'image-001.jpg', 'result': '3574660239843', format: 'ean_13', mustPass: true },
    { 'name': 'image-002.jpg', 'result': '8032754490297', format: 'ean_13', mustPass: true },
    // Test without mustPass will use it.allowFail() by default
    { 'name': 'image-003.jpg', 'result': '4006209700068', format: 'ean_13' },
]);
```

## Current Test Status

As of the latest update:
- **185 tests passing**
- **26 tests pending** (expected failures, using `it.allowFail()`)
- **159 tests marked with `mustPass: true`** (will fail if they break)

### Decoders with all tests marked `mustPass`:
- ✅ ean (10/10)
- ✅ ean_extended (10/10)
- ✅ upc (10/10)
- ✅ upc_e (10/10)
- ✅ i2of5 (5/5)
- ✅ 2of5 (10/10)
- ✅ code_93 (11/11)

### Decoders with some tests marked `mustPass`:
- ⚠️ code_128: 9/10 (image-004 fails)
- ⚠️ code_39: 8/10 (images 005, 011 fail)
- ⚠️ code_39_vin: 3/11 (most tests fail in node environment)
- ⚠️ code_32: 5/10 (several tests fail)
- ⚠️ ean_8: 7/8 (image-004 gets wrong result)
- ⚠️ codabar: 9/10 (image-008 fails)

## Running Tests

```bash
# Run node integration tests
npm run test:node

# Run browser tests (requires Cypress)
npm run test:browser-all
```

## Adding New Tests

When adding new decoder test cases:

1. Add the test data to the appropriate `runDecoderTest()` call
2. Run the tests to verify they pass
3. If the test passes consistently, add `mustPass: true` to the test object
4. If the test fails or is flaky, leave `mustPass` undefined (will use `it.allowFail()`)

Example:
```typescript
runDecoderTest('my_decoder', generateConfig(), [
    // This test is known to work - mark as mustPass
    { 'name': 'working-image.jpg', 'result': '123456', format: 'my_format', mustPass: true },
    
    // This test is flaky or fails - don't mark as mustPass
    { 'name': 'problematic-image.jpg', 'result': '789012', format: 'my_format' },
]);
```

## Troubleshooting

### A `mustPass` test is now failing

If a test marked with `mustPass: true` starts failing, this indicates a regression:

1. **Investigate the failure** - Check what changed in the codebase
2. **Fix the regression** - The test was working before, so something broke it
3. **Only remove `mustPass` as a last resort** - If you determine the test was incorrectly marked or the expected behavior has legitimately changed

### Converting a failing test to `mustPass`

If you fix a failing test:

1. Verify it passes consistently in both Node and browser environments
2. Add `mustPass: true` to the test object
3. Remove any comments about it being a known failure
4. Update this README if it changes the statistics

## Browser vs Node Differences

Some tests behave differently in browser (Cypress) vs Node environments. This is a known issue being investigated. Tests are currently marked `mustPass: true` based on their Node test results. Comments like `// fails in node` or `// passes only in browser` document these differences.
