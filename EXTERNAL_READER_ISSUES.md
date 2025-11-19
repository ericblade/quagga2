# External Reader Plugin - Known Issues and Workarounds

## Issue: External Reader Intermittent Failures in TypeScript Environment

### Symptoms

When registering an external reader in a TypeScript test environment (using ts-mocha), certain images may fail to decode even though:
1. The same reader works perfectly when built-in
2. The same reader works perfectly when used with compiled JavaScript
3. The reader code itself is correct

**Affected:**
- Code 128 reader: image-004.jpg consistently fails
- Potentially other readers/images

**Not Affected:**
- Production usage (compiled bundles)
- Tests against compiled code

### Root Cause

The issue stems from TypeScript module loading and instantiation when the same class is:
1. Imported by barcode_decoder as a built-in reader
2. Imported by test code and registered as an external reader

This creates subtle differences in how the reader instances behave, possibly due to:
- Different prototype chains
- Different module contexts
- Different initialization state

### Workarounds

#### Option 1: Test Against Compiled Code (Recommended)

Instead of running tests directly against TypeScript source, build the library first:

```bash
# Build the library
npm run build:node

# Then run tests
npm test
```

This ensures tests run against the same code users will use in production.

#### Option 2: Use Built-in Readers for Testing

If you're testing barcode detection functionality (not specifically testing the external reader API), use the built-in readers:

```typescript
const config = {
    decoder: {
        readers: ['code_128_reader'],  // Use built-in, not external
    },
    // ... other config
};
```

#### Option 3: Accept Test Limitations

The `.allowFail` mechanism in the test suite will skip failing tests rather than fail the build. This is intentional for tests that are environment-sensitive.

### For Plugin Developers

If you're developing an external reader plugin:

1. **Test with compiled code**: Always test your plugin against the compiled `lib/quagga.js`, not TypeScript source
2. **Extend properly**: Make sure your reader properly extends `BarcodeReader` or a built-in reader
3. **Set FORMAT correctly**: Ensure the `FORMAT` property matches the expected format string
4. **Test thoroughly**: Test with multiple sample images, as some images may trigger edge cases

### Example External Reader

```typescript
import Code128Reader from '@ericblade/quagga2';

class MyCustomCode128Reader extends Code128Reader {
    FORMAT = 'code_128'; // or your custom format
    
    decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        // Your custom logic here
        const result = super.decode(row, start);
        
        // Post-process result if needed
        return result;
    }
}

// Register it
Quagga.registerReader('my_custom_reader', MyCustomCode128Reader);
```

### Future Improvements

This issue should be resolved in a future version by:
1. Improving module loading consistency
2. Better isolation of reader instances
3. More robust external reader registration mechanism

### Related Issues

- Original issue tracking test differences: [link to issue when created]
- Investigation findings: See `INVESTIGATION_FINDINGS.md`

## Testing External Readers

### Recommended Test Setup

```javascript
// test-external-reader.js
const Quagga = require('@ericblade/quagga2');
const MyReader = require('./my-reader');

// Register
Quagga.registerReader('my_reader', MyReader);

// Test
const config = {
    decoder: { readers: ['my_reader'] },
    src: 'path/to/test/image.jpg',
    // ... other config
};

Quagga.decodeSingle(config).then(result => {
    console.log('Decoded:', result.codeResult.code);
});
```

### What to Test

1. **Basic decoding**: Does your reader decode valid barcodes?
2. **Error handling**: Does it gracefully handle invalid images?
3. **Performance**: Is it performant enough for your use case?
4. **Edge cases**: Test with various barcode qualities, sizes, orientations

### What NOT to Test

Don't worry about testing the core Quagga2 infrastructure - that's covered by the main test suite. Focus on testing YOUR custom logic.

## Getting Help

If you encounter issues with external readers:

1. First, test against compiled code (not TypeScript source)
2. Check this document for known issues
3. Create a minimal reproduction case
4. Open an issue with:
   - Your reader code
   - Sample image (if possible)
   - Expected vs actual behavior
   - Environment details (Node version, browser, etc.)
