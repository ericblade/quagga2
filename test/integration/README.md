# Integration Tests

## Test Infrastructure

This directory contains integration tests for Quagga2's barcode decoder functionality.

### Test Behavior

By default, all decoder tests **must pass**. If a test fails, the entire test run fails, alerting developers to regressions.

For tests that are known to fail (inherited test cases or work-in-progress features), you can mark them with `allowFail: true`. These tests will be marked as "pending" instead of causing the test run to fail.

### Test Helper: `it.allowFail()`

The `it.allowFail()` helper is used internally when a test is marked with `allowFail: true`. When a test fails, it will be marked as "pending" instead of causing the test run to fail.

### Marking Tests with `allowFail`

In the test data structures, you can mark individual test cases that are expected to fail with `allowFail: true`:

```typescript
runDecoderTest('code_39', generateConfig({
    decoder: { readers: ['code_39_reader'] }
}), [
    // This test passes and will fail the build if it stops working
    { 'name': 'image-001.jpg', 'result': 'B3% $DAD$', format: 'code_39' },
    
    // This test is known to fail - mark it with allowFail
    { 'name': 'image-005.jpg', 'result': 'CODE39', format: 'code_39', allowFail: true },
    
    // This test passes
    { 'name': 'image-006.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
]);
```

## Current Test Status

As of the latest update:
- **185 tests passing** (will fail the build if they break)
- **26 tests marked with `allowFail: true`** (known failures, marked as pending)

### Tests marked with `allowFail`:
- **code_39**: 2 tests (image-005, image-011)
- **code_39_vin**: 8 tests (image-002, 003, 004, 005, 007, 008, 009, 010)
- **code_32**: 5 tests (image-2, 3, 6, 7, 8)
- **ean_8**: 1 test (image-004 - gets wrong result in node)
- **codabar**: 1 test (image-008)
- **External Reader code_128**: 1 test (image-004)

### Decoders with all tests passing (0 allowFail):
- ✅ ean (10 tests)
- ✅ ean_extended (10 tests)
- ✅ code_128 (10 tests)
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

1. Add the test data to the appropriate `runDecoderTest()` call **without** `allowFail`
2. Run the tests to verify they pass
3. If the test fails and you want to preserve it for future debugging, add `allowFail: true`
4. If the test passes, leave it without any flag - it will automatically fail the build if it breaks

Example:
```typescript
runDecoderTest('my_decoder', generateConfig(), [
    // This test should work - no flag needed
    { 'name': 'working-image.jpg', 'result': '123456', format: 'my_format' },
    
    // This test is known to fail - mark with allowFail
    { 'name': 'problematic-image.jpg', 'result': '789012', format: 'my_format', allowFail: true },
]);
```

## Fixing Failing Tests

When you fix a test that was marked with `allowFail: true`:

1. Remove the `allowFail: true` flag from the test
2. Verify the test passes consistently in both Node and browser environments
3. The test will now fail the build if it breaks in the future

## Design Philosophy

The default behavior is "tests must pass" to catch regressions early. Only tests explicitly marked with `allowFail: true` are allowed to fail without breaking the build. This ensures that:

- **Regressions are caught immediately** - If a working test breaks, the build fails
- **Known failures are preserved** - Tests marked with `allowFail` can fail without breaking CI
- **Minimal flags needed** - Most tests don't need any special marking
- **Clear intent** - Tests marked with `allowFail` clearly indicate known issues

## Browser vs Node Differences

Some tests behave differently in browser (Cypress) vs Node environments. This is a known issue being investigated. Tests are marked with `allowFail: true` if they fail in the node environment, which is what CI uses for the integration test run.
