# Use Preprocessors {#use-preprocessors}

Preprocessors allow you to transform images before barcode detection and decoding. This guide covers using built-in preprocessors and creating your own.

## When to Use Preprocessors {#when-to-use}

Use preprocessors when you need to:

- **Handle barcodes without whitespace**: Barcodes require "quiet zones" (whitespace) around them. Use `addBorder()` when barcodes are cropped tightly.
- **Improve contrast**: Enhance images with poor lighting or low contrast
- **Reduce noise**: Apply smoothing or filtering to noisy images
- **Apply color corrections**: Adjust brightness, gamma, or channels

## Using Built-in Preprocessors {#built-in-preprocessors}

### addBorder {#addborder}

Adds a white border around the image by shrinking the content slightly. This simulates the quiet zone that barcodes need for proper detection.

```javascript
Quagga.decodeSingle({
    src: 'barcode-without-whitespace.jpg',
    preprocessors: [Quagga.Preprocessors.addBorder(20)],
    decoder: {
        readers: ['code_128_reader']
    }
});
```

**Parameters:**
- `size`: Number of pixels of white border to add on each side (recommended: 10-30)

**How it works:**
- Image dimensions remain unchanged
- Content is shrunk using bilinear interpolation to make room for the border
- Border is filled with white (255) pixels

**Example - Fixing a barcode with no quiet zone:**

```javascript
// Barcode image has no whitespace around it
Quagga.decodeSingle({
    src: 'tight-barcode.gif',
    inputStream: {
        type: 'ImageStream',
        size: 800
    },
    preprocessors: [Quagga.Preprocessors.addBorder(20)],
    decoder: {
        readers: ['code_128_reader']
    },
    locate: true,
    locator: {
        halfSample: false,
        patchSize: 'medium'
    }
}, function(result) {
    if (result && result.codeResult) {
        console.log('Decoded:', result.codeResult.code);
    }
});
```

## Chaining Multiple Preprocessors {#chaining-preprocessors}

Preprocessors are applied in array order:

```javascript
preprocessors: [
    Quagga.Preprocessors.addBorder(15),
    myContrastEnhancer,
    myNoiseReducer
]
```

Each preprocessor receives the output of the previous one.

## Creating Custom Preprocessors {#custom-preprocessors}

Custom preprocessors are functions that modify image data in place.

### Type Signature {#type-signature}

```typescript
type QuaggaImagePreprocessor = (imageWrapper: ImageWrapper) => ImageWrapper;
```

### Guidelines {#guidelines}

1. **Modify in place**: For best performance, modify `imageWrapper.data` directly
2. **Maintain dimensions**: Keep the same image width and height
3. **Return the same instance**: Return the imageWrapper that was passed in

### ImageWrapper Structure {#imagewrapper-structure}

```typescript
interface ImageWrapper {
    data: Uint8Array;  // Grayscale pixel values (0-255)
    size: {
        x: number;     // Width
        y: number;     // Height
    };
}
```

### Example: Invert Colors {#example-invert}

```javascript
const invertColors = (imageWrapper) => {
    for (let i = 0; i < imageWrapper.data.length; i++) {
        imageWrapper.data[i] = 255 - imageWrapper.data[i];
    }
    return imageWrapper;
};

// Use it
Quagga.init({
    preprocessors: [invertColors],
    // ... other config
});
```

### Example: Increase Contrast {#example-contrast}

```javascript
const increaseContrast = (imageWrapper) => {
    const factor = 1.5;  // contrast multiplier
    const midpoint = 128;
    
    for (let i = 0; i < imageWrapper.data.length; i++) {
        const value = imageWrapper.data[i];
        const adjusted = midpoint + (value - midpoint) * factor;
        imageWrapper.data[i] = Math.max(0, Math.min(255, adjusted));
    }
    return imageWrapper;
};
```

### Example: Simple Threshold {#example-threshold}

```javascript
const threshold = (cutoff = 128) => (imageWrapper) => {
    for (let i = 0; i < imageWrapper.data.length; i++) {
        imageWrapper.data[i] = imageWrapper.data[i] >= cutoff ? 255 : 0;
    }
    return imageWrapper;
};

// Use with custom threshold value
preprocessors: [threshold(100)]
```

### Example: Brightness Adjustment {#example-brightness}

```javascript
const adjustBrightness = (offset) => (imageWrapper) => {
    for (let i = 0; i < imageWrapper.data.length; i++) {
        const adjusted = imageWrapper.data[i] + offset;
        imageWrapper.data[i] = Math.max(0, Math.min(255, adjusted));
    }
    return imageWrapper;
};

// Brighten the image
preprocessors: [adjustBrightness(30)]
```

## Performance Considerations {#performance}

Preprocessors run on every frame (for live scanning) or on each image (for batch processing).

**Best practices:**
- Modify data in place rather than creating copies
- Use TypedArray methods when possible (`fill()`, etc.)
- Keep algorithms simple - avoid expensive operations
- Test performance impact with `console.time()`

**Example with performance measurement:**

```javascript
const timedPreprocessor = (imageWrapper) => {
    console.time('preprocessor');
    
    // Your processing here
    for (let i = 0; i < imageWrapper.data.length; i++) {
        imageWrapper.data[i] = 255 - imageWrapper.data[i];
    }
    
    console.timeEnd('preprocessor');
    return imageWrapper;
};
```

## Debugging Preprocessors {#debugging}

To visualize what your preprocessor does:

```javascript
const debugPreprocessor = (imageWrapper) => {
    // Log some statistics
    let min = 255, max = 0, sum = 0;
    for (let i = 0; i < imageWrapper.data.length; i++) {
        min = Math.min(min, imageWrapper.data[i]);
        max = Math.max(max, imageWrapper.data[i]);
        sum += imageWrapper.data[i];
    }
    console.log('Image stats:', {
        width: imageWrapper.size.x,
        height: imageWrapper.size.y,
        min, max,
        avg: sum / imageWrapper.data.length
    });
    
    return imageWrapper;
};
```

## Visualizing with Overlay Canvas {#visualizing-overlay}

When using LiveStream or VideoStream input sources, you can draw on the overlay canvas to visualize preprocessing effects. The overlay canvas is positioned over the video feed.

**Setting up the canvas:**

```javascript
Quagga.init({
    inputStream: {
        type: 'LiveStream',
        target: document.querySelector('#barcode-scanner')
    },
    // ... other config
}, function(err) {
    if (err) return console.error(err);
    Quagga.start();
});
```

**Drawing on the overlay:**

```javascript
// Access the overlay canvas
const overlayCanvas = document.querySelector('canvas.drawingBuffer');
const ctx = overlayCanvas.getContext('2d');

// Draw after each processed frame
Quagga.onProcessed(function(result) {
    // Clear previous drawings
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    // Draw custom visualizations
    if (result && result.box) {
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(result.box[0][0], result.box[0][1], 
                       result.box[2][0] - result.box[0][0],
                       result.box[2][1] - result.box[0][1]);
    }
});
```

**Visualizing preprocessing effects:**

To visualize what your preprocessor does, you can render the processed image data to the overlay:

```javascript
const visualizePreprocessor = (imageWrapper) => {
    const overlayCanvas = document.querySelector('canvas.drawingBuffer');
    if (overlayCanvas) {
        const ctx = overlayCanvas.getContext('2d');
        const imageData = ctx.createImageData(imageWrapper.size.x, imageWrapper.size.y);
        
        // Convert grayscale to RGBA for display
        for (let i = 0; i < imageWrapper.data.length; i++) {
            const val = imageWrapper.data[i];
            imageData.data[i * 4 + 0] = val; // R
            imageData.data[i * 4 + 1] = val; // G
            imageData.data[i * 4 + 2] = val; // B
            imageData.data[i * 4 + 3] = 128; // A (semi-transparent)
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    return imageWrapper;
};
```

## Related {#related}

- [Configuration Reference](../reference/configuration.md#preprocessors) - Complete preprocessors config
- [Algorithm Overview](../explanation/algorithm-overview.md) - Where preprocessing fits in the pipeline
- [Handle Difficult Barcodes](handle-difficult-barcodes.md) - Other techniques for problem barcodes

---

[← Back to How-To Guides](index.md)
