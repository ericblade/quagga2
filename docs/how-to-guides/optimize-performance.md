# Optimize Performance {#optimize-performance}

This guide covers techniques to improve Quagga2's barcode scanning performance.

## Overview {#overview}

Performance optimization in Quagga2 involves balancing accuracy against speed. The key areas to optimize are:

- Input resolution and scaling
- Locator configuration
- Reader selection
- Processing frequency

## Input Resolution {#input-resolution}

### Using `inputStream.size` {#inputstream-size}

Reducing the processing resolution is the most effective way to improve performance:

```javascript
Quagga.init({
  inputStream: {
    size: 640  // Process at 640px max dimension instead of full resolution
  }
});
```

**Recommended values:**
- **1280px** - High quality, slower (good for static images)
- **800px** - Balanced (default for `decodeSingle`)
- **640px** - Fast (recommended for live scanning)
- **480px** - Very fast (may reduce accuracy)

### Camera Constraints {#camera-constraints}

Request only the resolution you need:

```javascript
inputStream: {
  constraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
}
```

## Locator Configuration {#locator-configuration}

### Half Sampling {#half-sampling}

Keep `halfSample: true` (default) for faster localization:

```javascript
locator: {
  halfSample: true  // Processes at half resolution
}
```

### Patch Size {#patch-size}

Larger patch sizes are faster but may miss small barcodes:

```javascript
locator: {
  patchSize: "large"  // Options: x-small, small, medium, large, x-large
}
```

## Reader Selection {#reader-selection}

Only enable the barcode formats you need:

```javascript
decoder: {
  readers: ["code_128_reader"]  // Don't enable all readers
}
```

## Processing Frequency {#processing-frequency}

Limit scan rate to reduce CPU usage:

```javascript
Quagga.init({
  frequency: 10  // Max 10 scans per second
});
```

## Disable Localization {#disable-localization}

If barcode position is fixed, disable localization entirely:

```javascript
Quagga.init({
  locate: false,
  inputStream: {
    area: {
      top: "25%",
      right: "25%",
      bottom: "25%",
      left: "25%"
    }
  }
});
```

## Related {#related}

- [Configuration Reference](../reference/configuration.md) - All configuration options
- [How Barcode Localization Works](../explanation/how-barcode-localization-works.md) - Understanding the algorithm

---

[← Back to How-To Guides](index.md)
