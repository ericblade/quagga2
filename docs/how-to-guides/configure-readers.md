# Configure Barcode Readers {#configure-readers}

This guide explains how to configure which barcode formats Quagga2 will detect.

## Basic Configuration {#basic-configuration}

Specify readers in the `decoder.readers` array:

```javascript
Quagga.init({
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  }
});
```

## Available Readers {#available-readers}

| Reader | Format | Common Uses |
|--------|--------|-------------|
| `code_128_reader` | Code 128 | Shipping, packaging |
| `ean_reader` | EAN-13 | Retail products |
| `ean_8_reader` | EAN-8 | Small products |
| `upc_reader` | UPC-A | North American retail |
| `upc_e_reader` | UPC-E | Small products |
| `code_39_reader` | Code 39 | Industrial |
| `code_39_vin_reader` | Code 39 VIN | Vehicle identification |
| `codabar_reader` | Codabar | Libraries, blood banks |
| `i2of5_reader` | Interleaved 2 of 5 | Warehouse |
| `2of5_reader` | Standard 2 of 5 | Industrial |
| `code_93_reader` | Code 93 | Logistics |
| `code_32_reader` | Code 32 | Italian pharmaceuticals |

## Reader Priority {#reader-priority}

Readers are processed in order. Put most likely formats first:

```javascript
decoder: {
  readers: [
    "ean_reader",     // Most common - checked first
    "upc_reader",     // Second most common
    "code_128_reader" // Fallback
  ]
}
```

## EAN Supplements {#ean-supplements}

To read EAN-2 or EAN-5 extension supplements:

```javascript
decoder: {
  readers: [
    "ean_reader",  // Regular EAN without supplements
    {
      format: "ean_reader",
      config: {
        supplements: ["ean_5_reader", "ean_2_reader"]
      }
    }
  ]
}
```

## Best Practices {#best-practices}

1. **Only enable needed readers** - More readers = slower performance
2. **Order by frequency** - Put most common formats first
3. **Test thoroughly** - Some formats can conflict

## Related {#related}

- [Supported Barcode Types](../reference/readers.md) - Complete reader documentation
- [Configuration Reference](../reference/configuration.md) - All configuration options

---

[← Back to How-To Guides](index.md)
