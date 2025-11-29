# How-To: Create and Use External Readers {#create-and-use-external-readers}

This guide explains how to create custom barcode reader plugins and integrate them into Quagga2.

## Using Existing External Readers {#using-existing-external-readers}

### QR Code Reader {#qr-code-reader}

The most common external reader is [quagga2-reader-qr](https://github.com/ericblade/quagga2-reader-qr) for QR code support:

```javascript
import Quagga from '@ericblade/quagga2';
import QRReader from 'quagga2-reader-qr';

// Register the external reader
Quagga.registerReader('qr', QRReader);

// Use it in your config
Quagga.init({
  decoder: {
    readers: ['qr']
  }
});
```

## External Reader Priority {#external-reader-priority}

External readers follow the **same priority rules** as built-in readers:

1. **Registration first**: Call `Quagga.registerReader(name, ReaderClass)` before using the reader
2. **Position determines priority**: The reader's position in the `readers` array determines when it attempts to decode
3. **First success wins**: The first reader to return a valid result is used

### Example: Prioritizing External Readers {#prioritizing-external-readers}

```javascript
// Register external reader
Quagga.registerReader('my_custom_reader', MyCustomReader);

// External reader tried first, then built-in readers
Quagga.init({
  decoder: {
    readers: ['my_custom_reader', 'ean_reader', 'code_128_reader']
  }
});
```

### Example: External Reader as Fallback {#external-reader-fallback}

```javascript
// Register external reader
Quagga.registerReader('my_fallback_reader', MyFallbackReader);

// Built-in readers tried first, external as fallback
Quagga.init({
  decoder: {
    readers: ['ean_reader', 'code_128_reader', 'my_fallback_reader']
  }
});
```

## Creating Custom Readers {#creating-custom-readers}

Quagga2 exports the `BarcodeReader` prototype that you can extend to create custom readers.

### Basic Reader Structure {#basic-reader-structure}

```javascript
import { Readers } from '@ericblade/quagga2';

const { BarcodeReader } = Readers;

class MyCustomReader extends BarcodeReader {
  FORMAT = 'my_custom_format';
  
  constructor(config, supplements) {
    super(config, supplements);
    // Custom initialization
  }
  
  decode(row, start) {
    // Implement barcode decoding logic
    // row: Array<number> - binary line data
    // start: number - starting position
    
    // Return null if no barcode found
    // Return Barcode object if successful
    return null;
  }
}

export default MyCustomReader;
```

### Reader Return Format {#reader-return-format}

Your `decode()` method should return either `null` (no match) or a result object:

```javascript
{
  code: '1234567890',        // The decoded barcode value
  start: 0,                   // Start position in the row
  end: 100,                   // End position in the row
  startInfo: { start: 0, end: 10 },  // Start pattern info
  format: 'my_custom_format', // Your reader's format name
  decodedCodes: [...]         // Optional: decoded character info
}
```

### Pattern Matching Utilities {#pattern-matching-utilities}

BarcodeReader provides useful methods for pattern matching:

- `_nextSet(line, offset)` - Find next set (1) bit
- `_nextUnset(line, offset)` - Find next unset (0) bit
- `_matchPattern(counter, code, maxSingleError)` - Match bar patterns
- `_fillCounters(offset, end, isWhite)` - Count consecutive bars/spaces

### Example: Simple Pattern Reader {#simple-pattern-reader}

```javascript
class SimpleBarReader extends BarcodeReader {
  FORMAT = 'simple_bar';
  START_PATTERN = [1, 1, 1];  // Three bars pattern
  
  decode(row, start) {
    if (row) {
      this._row = row;
    }
    
    // Find start pattern
    const startInfo = this._findPattern(this.START_PATTERN, 0, false);
    if (!startInfo) {
      return null;
    }
    
    // Decode the barcode content
    const result = this._decodeContent(startInfo.end);
    if (!result) {
      return null;
    }
    
    return {
      code: result.code,
      start: startInfo.start,
      end: result.end,
      startInfo: startInfo,
      format: this.FORMAT
    };
  }
  
  _decodeContent(offset) {
    // Implement your decoding logic
    return null;
  }
}
```

## Image-Based Readers {#image-based-readers}

For non-linear barcodes (like QR codes), implement `decodeImage()` instead:

```javascript
class MyImageReader extends BarcodeReader {
  FORMAT = 'my_image_format';
  
  // Override decode to return null (not a linear barcode)
  decode() {
    return null;
  }
  
  // Implement image-based decoding
  async decodeImage(imageWrapper) {
    // imageWrapper.data - pixel data
    // imageWrapper.size - { x, y } dimensions
    
    // Process the image and decode
    const result = await this.processImage(imageWrapper);
    
    if (!result) {
      return null;
    }
    
    return {
      codeResult: {
        code: result.data,
        format: this.FORMAT
      }
    };
  }
}
```

## Testing Your Reader {#testing-your-reader}

1. **Unit tests**: Test pattern matching and decoding logic in isolation
2. **Integration tests**: Use `Quagga.decodeSingle()` with test images
3. **Live testing**: Test with real camera input

### Example Test {#example-test}

```javascript
import Quagga from '@ericblade/quagga2';
import MyCustomReader from './my-custom-reader';

Quagga.registerReader('my_custom', MyCustomReader);

const result = await Quagga.decodeSingle({
  src: './test-image.jpg',
  decoder: {
    readers: ['my_custom']
  }
});

console.log('Result:', result?.codeResult?.code);
```

## Best Practices {#best-practices}

1. **Set unique FORMAT**: Use a distinctive format name to identify your reader
2. **Handle edge cases**: Return `null` gracefully when patterns don't match
3. **Validate checksums**: Implement checksum validation when the format supports it
4. **Consider performance**: Optimize pattern matching for real-time scanning
5. **Test thoroughly**: Test with various image qualities and conditions

## Related {#related}

- [Supported Barcode Types](../reference/readers.md) - Built-in readers
- [Configuration Reference](../reference/configuration.md) - Full config options
- [quagga2-reader-qr](https://github.com/ericblade/quagga2-reader-qr) - Example external reader

---

[← Back to How-To Guides](index.md)
