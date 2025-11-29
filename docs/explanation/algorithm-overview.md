# Algorithm Overview {#algorithm-overview}

This page provides a high-level overview of how Quagga2 processes images to detect and decode barcodes.

## Processing Pipeline {#processing-pipeline}

Quagga2 processes each frame through a multi-stage pipeline:

```
Input Image → Preprocessing → Localization → Decoding → Result
```

### 1. Preprocessing {#preprocessing}

- **Scaling**: Image is resized based on `inputStream.size`
- **Grayscale conversion**: Color image converted to grayscale
- **Area cropping**: If `inputStream.area` is set, crop to that region

### 2. Localization {#localization}

When `locate: true` (default):

1. **Binarization**: Convert to black/white using Otsu's method
2. **Grid division**: Split image into patches
3. **Skeletonization**: Extract line structures
4. **Pattern analysis**: Find barcode-like patterns
5. **Bounding box**: Calculate barcode region

See [How Barcode Localization Works](how-barcode-localization-works.md) for detailed explanation.

### 3. Decoding {#decoding}

1. **Scanline extraction**: Sample pixels along detected barcode
2. **Pattern matching**: Match bar/space patterns to barcode format
3. **Character decoding**: Convert patterns to characters
4. **Checksum validation**: Verify barcode integrity

## Key Algorithms {#key-algorithms}

### Otsu's Method {#otsus-method}

Automatic threshold selection for binarization. Adapts to varying lighting conditions by analyzing the image histogram.

### Connected Component Labeling {#connected-component-labeling}

Groups adjacent pixels into distinct regions. Used during localization to identify potential barcode patterns.

### Image Moments {#image-moments}

Mathematical technique to calculate orientation and position of detected patterns.

## Performance Characteristics {#performance-characteristics}

| Factor | Impact | Mitigation |
|--------|--------|------------|
| Image size | Linear increase | Use `inputStream.size` |
| Number of readers | Linear increase | Only enable needed readers |
| Localization | ~60% of processing time | Use `locate: false` if position known |
| Half sampling | 4x faster | Keep `halfSample: true` |

## Related {#related}

- [How Barcode Localization Works](how-barcode-localization-works.md) - Detailed localization explanation
- [Architecture](architecture.md) - Code structure overview
- [Optimize Performance](../how-to-guides/optimize-performance.md) - Performance tuning

---

[← Back to Explanation](index.md)
