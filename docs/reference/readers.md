# Supported Barcode Types {#supported-barcode-types}

Quagga2 supports a wide variety of 1D barcode formats. This page lists all available barcode readers and how to configure them.

## Available Readers {#available-readers}

Quagga2 includes built-in readers for the following barcode formats:

| Reader Name | Barcode Format | Common Uses |
|-------------|----------------|-------------|
| `code_128_reader` | [Code 128](https://en.wikipedia.org/wiki/Code_128) | General purpose, shipping, packaging |
| `ean_reader` | [EAN-13](https://en.wikipedia.org/wiki/International_Article_Number) | Retail products worldwide |
| `ean_8_reader` | [EAN-8](https://en.wikipedia.org/wiki/EAN-8) | Small retail products |
| `code_39_reader` | [Code 39](https://en.wikipedia.org/wiki/Code_39) | Automotive, defense, healthcare |
| `code_39_vin_reader` | Code 39 VIN | Vehicle Identification Numbers |
| `codabar_reader` | [Codabar](https://en.wikipedia.org/wiki/Codabar) | Libraries, blood banks, logistics |
| `upc_reader` | [UPC-A](https://en.wikipedia.org/wiki/Universal_Product_Code) | Retail products (North America) |
| `upc_e_reader` | [UPC-E](https://en.wikipedia.org/wiki/Universal_Product_Code#UPC-E) | Small retail products |
| `i2of5_reader` | [Interleaved 2 of 5](https://en.wikipedia.org/wiki/Interleaved_2_of_5) | Warehouse, distribution |
| `2of5_reader` | [Standard 2 of 5](https://en.wikipedia.org/wiki/Two-out-of-five_code) | Industrial, airline tickets |
| `code_93_reader` | [Code 93](https://en.wikipedia.org/wiki/Code_93) | Logistics, retail |
| `code_32_reader` | [Code 32](https://en.wikipedia.org/wiki/Pharmacode#Code_32) | Italian pharmaceuticals |

## Basic Configuration {#basic-configuration}

Specify which barcode types to detect in the `decoder.readers` array:

```javascript
Quagga.init({
  decoder: {
    readers: ["code_128_reader"]  // Only detect Code 128
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  Quagga.start();
});
```

### Multiple Readers {#multiple-readers}

You can enable multiple readers to detect different barcode types:

```javascript
Quagga.init({
  decoder: {
    readers: [
      "code_128_reader",
      "ean_reader",
      "upc_reader"
    ]
  }
});
```

## Important Considerations {#important-considerations}

### Reader Priority and Order {#reader-priority-and-order}

**Readers are processed in the exact order they appear in the `readers` array.** The first reader to successfully decode the barcode wins - subsequent readers are not tried.

This allows you to prioritize certain formats over others when multiple formats might match the same barcode pattern:

```javascript
decoder: {
    // EAN-13 checked first, then UPC formats
    readers: ['ean_reader', 'upc_reader', 'upc_e_reader']
}
```

**Why order matters:**

- Readers are processed sequentially, not in parallel
- Some readers may return false positives for other formats
- Example: EAN-13 and UPC-A/UPC-E share similar patterns and can clash
- The first successful decode is returned immediately

**Best practice**: List your most commonly expected barcode types first for best accuracy and performance.

### Don't Enable All Readers {#dont-enable-all-readers}

**Why not enable all readers by default?**

- More readers = more processing time
- Increased chance of false positives
- Some formats overlap and can interfere

**Best practice**: Only enable the barcode formats you actually need to scan.

### Format Conflicts {#format-conflicts}

Some barcode formats are subsets or extensions of others:

- **UPC-A** is a subset of **EAN-13**
- **EAN-8** is shorter version of **EAN-13**
- **Code 39** and **Code 39 VIN** share similar patterns

Be careful when enabling multiple related formats together.

## EAN Extensions {#ean-extensions}

### EAN-2 and EAN-5 Supplements {#ean-supplements}

The default `ean_reader` does not read extensions like [EAN-2](https://en.wikipedia.org/wiki/EAN_2) or [EAN-5](https://en.wikipedia.org/wiki/EAN_5) (additional digits printed beside the main barcode).

To enable supplement decoding:

```javascript
Quagga.init({
  decoder: {
    readers: [{
      format: "ean_reader",
      config: {
        supplements: [
          'ean_5_reader',  // 5-digit supplement
          'ean_2_reader'   // 2-digit supplement
        ]
      }
    }]
  }
});
```

### Important Notes About Supplements {#supplements-notes}

**Supplement order matters**: The reader stops when it finds the first matching supplement. List `ean_5_reader` before `ean_2_reader` if you want to prioritize 5-digit extensions.

**Cannot read regular EAN-13 with supplements enabled**: If you configure supplements, that reader instance can **only** decode EAN codes **with** supplements. To read both:

```javascript
Quagga.init({
  decoder: {
    readers: [
      "ean_reader",  // Regular EAN-13 without supplements
      {
        format: "ean_reader",
        config: {
          supplements: ['ean_5_reader', 'ean_2_reader']
        }
      }  // EAN-13 with supplements
    ]
  }
});
```

This configuration creates two separate reader instances.

## External Readers {#external-readers}

Quagga2 supports external reader modules for additional barcode formats not built into the core library.

### QR Code Reader {#qr-code-reader}

For QR code support, see [quagga2-reader-qr](https://github.com/ericblade/quagga2-reader-qr).

External readers extend Quagga2's capabilities beyond 1D barcodes:

```javascript
import Quagga from '@ericblade/quagga2';
import QRReader from 'quagga2-reader-qr';

// Register external reader
Quagga.registerReader('qr', QRReader);

Quagga.init({
  decoder: {
    readers: ['qr']  // Use external QR reader
  }
});
```

### External Reader Priority {#external-reader-priority}

External readers follow the **same priority rules** as built-in readers. Once registered with `Quagga.registerReader()`, an external reader can be placed anywhere in the `readers` array, and its position determines when it attempts to decode relative to other readers:

```javascript
// Register external reader first
Quagga.registerReader('my_custom_reader', MyCustomReader);

// Use in config - position determines priority
Quagga.init({
  decoder: {
    // External reader tried first, then built-in readers
    readers: ['my_custom_reader', 'ean_reader', 'code_128_reader']
  }
});
```

**Key points:**
- External readers must be registered via `registerReader()` before use
- Their position in `readers` array determines decode priority
- There is no automatic "internal first, external second" ordering
- External readers interleave freely with built-in readers

### Creating Custom Readers {#creating-custom-readers}

You can create your own barcode reader implementations by extending the `BarcodeReader` prototype exported by Quagga2. See [How-To: Create External Readers](../how-to-guides/external-readers.md) for details.

## Reader Performance {#reader-performance}

Different readers have different performance characteristics:

**Fastest readers**:

- `code_128_reader` - Optimized, widely used
- `ean_reader` - Fast and reliable

**Slower readers**:

- `code_39_reader` - More complex pattern
- `i2of5_reader` - Requires more validation

**Resource intensive**:

- Multiple readers enabled simultaneously
- Readers with supplements configured

## Validation {#validation}

Some barcode formats include check digits for validation:

- **EAN-13/EAN-8**: Built-in check digit
- **Code 128**: Built-in check digit
- **UPC-A/UPC-E**: Built-in check digit

For additional validation in your application, consider using [barcode-validator](https://github.com/ericblade/barcode-validator).

## Related {#related}

- [Configuration Reference](configuration.md) - Complete config options
- [API Documentation](api.md) - How to use Quagga2 methods
- [Tips & Tricks](../how-to-guides/tips-and-tricks.md) - Handling false positives

---

[← Back to Reference](index.md)
