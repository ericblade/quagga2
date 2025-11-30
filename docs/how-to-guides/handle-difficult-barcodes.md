# Handle Difficult Barcodes {#handle-difficult-barcodes}

This guide provides techniques for improving barcode detection in challenging conditions.

## Common Challenges {#common-challenges}

- Poor lighting or shadows
- Blurry or out-of-focus images
- Small or distant barcodes
- Damaged or partially obscured barcodes
- Low contrast between bars and background

## Improving Detection {#improving-detection}

### Adjust Patch Size {#adjust-patch-size}

For small or distant barcodes, use a smaller patch size:

```javascript
locator: {
  patchSize: "small"  // or "x-small" for very small barcodes
}
```

### Increase Resolution {#increase-resolution}

Higher resolution provides more detail:

```javascript
inputStream: {
  size: 1280,  // Larger processing size
  constraints: {
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
}
```

### Disable Half Sampling {#disable-half-sampling}

For fine details, process at full resolution:

```javascript
locator: {
  halfSample: false
}
```

## Handling False Positives {#handling-false-positives}

### Validate Results {#validate-results}

Check result confidence and format:

```javascript
Quagga.onDetected(function(result) {
  // Check if result has expected format
  if (result.codeResult.format !== 'ean_13') {
    return;  // Ignore unexpected formats
  }
  
  // Validate checksum externally if needed
  if (!validateBarcode(result.codeResult.code)) {
    return;
  }
  
  processBarcode(result.codeResult.code);
});
```

### Require Multiple Reads {#require-multiple-reads}

Confirm detection across multiple frames:

```javascript
let lastCode = null;
let readCount = 0;

Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  
  if (code === lastCode) {
    readCount++;
    if (readCount >= 3) {
      // Confirmed detection
      processBarcode(code);
      readCount = 0;
    }
  } else {
    lastCode = code;
    readCount = 1;
  }
});
```

## Using Debug Flags {#using-debug-flags}

Enable visual debugging to understand detection issues:

```javascript
Quagga.init({
  debug: true,
  decoder: {
    debug: {
      drawBoundingBox: true,
      drawScanline: true
    }
  },
  locator: {
    debug: {
      showFoundPatches: true
    }
  }
});
```

See [Use Debug Flags](use-debug-flags.md) for complete details.

## Related {#related}

- [Configuration Reference](../reference/configuration.md) - All configuration options
- [Optimize Performance](optimize-performance.md) - Balance accuracy vs speed
- [Use Debug Flags](use-debug-flags.md) - Diagnostic tools

---

[← Back to How-To Guides](index.md)
