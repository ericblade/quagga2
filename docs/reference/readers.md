# Supported Barcode Types {#supported-barcode-types}

Quagga2 supports a wide variety of 1D barcode formats. This page lists all available barcode readers and how to configure them.

## Available Readers {#available-readers}

Quagga2 includes built-in readers for the following barcode formats:

| Reader Name | Barcode Format | Common Uses |
|-------------|----------------|-------------|
| `code_128_reader` | [Code 128](https://en.wikipedia.org/wiki/Code_128), [GS1-128](https://en.wikipedia.org/wiki/GS1-128) | General purpose, shipping, packaging, supply chain |
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
| `pharmacode_reader` | [Pharmacode](https://en.wikipedia.org/wiki/Pharmacode) | Pharmaceutical packaging |

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

## GS1-128 Barcodes {#gs1-128-barcodes}

[GS1-128](https://en.wikipedia.org/wiki/GS1-128) (formerly known as EAN-128 or UCC-128) is a subset of Code 128 used extensively in supply chain and logistics. It uses special FNC1 (Function Code 1) characters to separate variable-length data fields called Application Identifiers (AIs).

### How GS1-128 Works {#gs1-128-how-it-works}

GS1-128 barcodes encode structured data using standardized Application Identifiers. For example:
- **AI 01** = GTIN (Global Trade Item Number)
- **AI 10** = Batch/Lot Number
- **AI 17** = Expiration Date
- **AI 21** = Serial Number

The FNC1 character acts as a field separator between variable-length AIs, allowing decoders to know where one field ends and another begins.

### FNC1 Character Handling {#fnc1-character-handling}

When the `code_128_reader` decodes a GS1-128 barcode, FNC1 characters are represented as ASCII 29 (Group Separator, `\x1D` or `\u001d`). This follows the GS1 standard for representing FNC1 in decoded data.

```javascript
Quagga.decodeSingle({
  src: 'gs1-128-barcode.jpg',
  decoder: {
    readers: ['code_128_reader']
  }
}, function(result) {
  if (result && result.codeResult) {
    const code = result.codeResult.code;
    // FNC1 characters appear as ASCII 29 (Group Separator)
    const GS = String.fromCharCode(29);  // '\x1D'
    
    // Split on Group Separator to get individual AI fields
    const fields = code.split(GS);
    console.log('Fields:', fields);
    // Example output: ["", "01034531200000111719050810ABCD1234", ...]
    
    // Or check for GS1-128 format (starts with FNC1)
    if (code.startsWith(GS)) {
      console.log('This is a GS1-128 barcode');
    }
  }
});
```

### Parsing GS1-128 Data {#parsing-gs1-128-data}

Once decoded, you can parse the GS1-128 data using the Application Identifier structure:

```javascript
function parseGS1(code) {
  const GS = String.fromCharCode(29);
  // Remove leading FNC1 if present
  const data = code.startsWith(GS) ? code.substring(1) : code;
  
  // Split by FNC1 separator
  const segments = data.split(GS);
  
  // Parse each segment for its AI
  // (A full implementation would use a complete AI table)
  return segments;
}
```

For full GS1 parsing, consider using a dedicated library like [gs1-barcode-parser](https://www.npmjs.com/package/gs1-barcode-parser) after decoding with Quagga2.

## EAN Extensions {#ean-extensions}

### EAN-2 and EAN-5 Supplements {#ean-supplements}

The EAN and UPC barcode formats support a supplement format, adding an additional 2 or 5 digits beyond the main barcode, EAN-2 and EAN-5, respectively. They are typically used for:
- **Magazines and periodicals**: The main barcode identifies the publication, while the supplement denotes issue numbers or publication dates
- **Books with ISBN**: The 5-digit supplement often encodes the suggested retail price

By default, `ean_reader` does not read and decode these extensions, you must explicitly enable support for them, if you are looking for them. Since UPC-A is a subset of EAN-13 -- UPC-A codes are EAN-13 codes that begin with a 0 -- supplement support configured on `ean_reader` also works for UPC-A codes.

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

#### Supplement Result Structure {#supplement-result-structure}

When a barcode with a supplement is decoded, the result includes a `supplement` property:

```javascript
{
  codeResult: {
    code: "419871600890101",    // Combined: main barcode + supplement
    format: "ean_13",          // Main barcode format
    supplement: {
      code: "01",              // Supplement digits only
      format: "ean_2"          // "ean_2" or "ean_5"
    }
  }
}
```

The main `codeResult.code` contains the full combined value, while `codeResult.supplement` provides the supplement details separately.

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
