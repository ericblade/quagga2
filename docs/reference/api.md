# API Documentation

Complete reference for all Quagga2 methods, callbacks, and events.

## Core Methods

### `Quagga.init(config, callback)`

Initializes the library with the given configuration and requests camera access if using live stream mode.

**Parameters**:

- `config` (Object) - Configuration object. See [Configuration Reference](configuration.md) for complete details.
- `callback` (Function) - Called when initialization completes: `callback(err)`
  - `err` (Error | null) - Error object if initialization failed, `null` on success

**Returns**: `void`

**Example - Live Camera**:

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner')  // Or '#scanner'
  },
  decoder: {
    readers: ["code_128_reader"]
  }
}, function(err) {
  if (err) {
    console.error("Initialization failed:", err);
    return;
  }
  console.log("Initialization successful, ready to start");
  Quagga.start();
});
```

**Example - Static Images**:

```javascript
Quagga.init({
  inputStream: {
    type: "ImageStream",
    src: "/path/to/images/*.jpg",
    target: document.querySelector('#scanner')
  },
  decoder: {
    readers: ["ean_reader", "code_128_reader"]
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  Quagga.start();
});
```

**Error Handling**:

The callback receives an `err` parameter if initialization fails. Common causes:

- User denies camera permission
- No camera device found
- Browser doesn't support required APIs
- Invalid configuration parameters

Always check for errors before calling `start()`:

**Target Element**:

If no `target` is specified, Quagga looks for an element matching the CSS selector `#interactive.viewport` (for backwards compatibility).

### `Quagga.start()`

Starts the video stream and begins locating and decoding barcodes.

**Parameters**: None

**Returns**: `void`

**Example**:

```javascript
Quagga.init(config, function(err) {
  if (!err) {
    Quagga.start();
  }
});
```

**Prerequisites**:

- `Quagga.init()` must have completed successfully
- For live stream: Camera permission must be granted

**Note**: Call this in the `init()` callback after checking for errors.

### `Quagga.stop()`

Stops the decoder from processing images and disconnects the camera if one was requested.

**Parameters**: None

**Returns**: `Promise<void>` - Resolves when cleanup is complete

**Example**:

```javascript
// Stop scanning
await Quagga.stop();
console.log("Scanner stopped");

// Or with .then()
Quagga.stop().then(() => {
  console.log("Scanner stopped");
});
```

**Behavior**:

- Stops processing new frames
- If using live camera: disconnects and releases camera
- Does not remove event listeners (use `offDetected()` / `offProcessed()` for that)
- Returns a Promise that resolves when camera release is complete

### `Quagga.onDetected(callback)`

Registers a callback that is triggered when a barcode is successfully located and decoded.

**Parameters**:

- `callback` (Function) - Handler function: `callback(data)`
  - `data` (Object) - Result object containing decoded barcode information

**Returns**: `void`

**Example**:

```javascript
Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  const format = result.codeResult.format;

  console.log(`Detected ${format} barcode: ${code}`);

  // Process the barcode
  processBarcode(code);
});
```

**Multiple Handlers**:

You can register multiple handlers - all will be called:

```javascript
Quagga.onDetected(handler1);
Quagga.onDetected(handler2);  // Both execute on detection
```

### `Quagga.onProcessed(callback)`

Registers a callback that is called for each processed frame, regardless of detection success.

**Parameters**:

- `callback` (Function) - Handler function: `callback(data)`
  - `data` (Object) - Processing result with detailed information

**Returns**: `void`

**Example**:

```javascript
Quagga.onProcessed(function(result) {
  const drawingCtx = Quagga.canvas.ctx.overlay;
  const drawingCanvas = Quagga.canvas.dom.overlay;

  if (result) {
    // Draw boxes and lines for visualization
    if (result.boxes) {
      drawingCtx.clearRect(0, 0,
        drawingCanvas.width, drawingCanvas.height);

      result.boxes.forEach(function(box) {
        Quagga.ImageDebug.drawPath(box, {x: 0, y: 1},
          drawingCtx, {color: "blue", lineWidth: 2});
      });
    }

    if (result.box) {
      Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1},
        drawingCtx, {color: "green", lineWidth: 2});
    }

    if (result.codeResult && result.codeResult.code) {
      // Successfully decoded
      console.log("Code detected:", result.codeResult.code);
    }
  }
});
```

**Use Cases**:

- Custom visualization of detection process
- Counting processed frames
- Performance monitoring
- Drawing custom overlays

### `Quagga.offDetected(handler)`

Removes a previously registered `onDetected` handler.

**Parameters**:

- `handler` (Function, optional) - Specific handler to remove. If omitted, **all** handlers are removed.

**Returns**: `void`

**Example**:

```javascript
function myHandler(result) {
  console.log(result.codeResult.code);
}

Quagga.onDetected(myHandler);

// Later: remove specific handler
Quagga.offDetected(myHandler);

// Or remove all handlers
Quagga.offDetected();
```

### `Quagga.offProcessed(handler)`

Removes a previously registered `onProcessed` handler.

**Parameters**:

- `handler` (Function, optional) - Specific handler to remove. If omitted, **all** handlers are removed.

**Returns**: `void`

**Example**:

```javascript
function processHandler(result) {
  // Process frame
}

Quagga.onProcessed(processHandler);

// Remove specific handler
Quagga.offProcessed(processHandler);

// Or remove all handlers
Quagga.offProcessed();
```

### `Quagga.decodeSingle(config, callback)`

Decodes a single image without using `getUserMedia`. Useful for processing uploaded images or static images.

**Parameters**:

- `config` (Object) - Configuration object (subset of full config)
- `callback` (Function) - Result handler: `callback(result)`
  - `result` (Object) - Same format as `onDetected` callback

**Returns**: `void`

**Example**:

```javascript
Quagga.decodeSingle({
  src: '/images/barcode.jpg',  // Or data URL
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  },
  locate: true  // Try to locate barcode in image
}, function(result) {
  if (result && result.codeResult) {
    console.log("Detected:", result.codeResult.code);
    console.log("Format:", result.codeResult.format);
  } else {
    console.log("No barcode detected");
  }
});
```

**Using Data URLs**:

```javascript
// From file input
document.querySelector('#file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    Quagga.decodeSingle({
      src: event.target.result,  // Data URL
      decoder: {
        readers: ["code_128_reader"]
      }
    }, function(result) {
      if (result && result.codeResult) {
        alert("Barcode: " + result.codeResult.code);
      }
    });
  };

  reader.readAsDataURL(file);
});
```

**Node.js Usage**:

```javascript
const Quagga = require('@ericblade/quagga2').default;

Quagga.decodeSingle({
  src: "./barcode.jpg",
  inputStream: {
    size: 800  // Restrict width to 800px
  },
  decoder: {
    readers: ["code_128_reader"]
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Code:", result.codeResult.code);
  }
});
```

## Result Object

The result object passed to `onDetected`, `onProcessed`, and `decodeSingle` callbacks contains detailed information about the detection and decoding process.

### Complete Result Structure

```javascript
{
  codeResult: {
    code: "FANAVF1461710",       // The decoded barcode string
    format: "code_128",           // Barcode format
    start: 355,                   // Start position
    end: 26,                      // End position
    codeset: 100,                 // Code 128 specific
    startInfo: {
      error: 1.0,
      code: 104,
      start: 21,
      end: 41
    },
    decodedCodes: [               // Individual code segments
      { code: 104, start: 21, end: 41 },
      // ... more segments
      { error: 0.88, code: 106, start: 328, end: 350 }
    ],
    endInfo: {
      error: 0.88,
      code: 106,
      start: 328,
      end: 350
    },
    direction: -1                 // Scan direction
  },
  line: [                         // Scan line coordinates
    { x: 25.97, y: 360.56 },
    { x: 401.92, y: 70.88 }
  ],
  angle: -0.657,                  // Rotation angle in radians
  pattern: [0, 0, 1, 1, ...],     // Bar pattern (0=space, 1=bar)
  box: [                          // Primary bounding box (4 corners)
    [77.41, 410.93],              // Top-left
    [0.05, 310.54],               // Top-right
    [360.16, 33.06],              // Bottom-right
    [437.51, 133.45]              // Bottom-left
  ],
  boxes: [                        // All detected boxes
    [/* box 1 */],
    [/* box 2 */],
    // ...
  ]
}
```

### Result Properties

| Property | Type | Description |
|----------|------|-------------|
| `codeResult` | Object | Decoded barcode information (may be `undefined` if detection failed) |
| `codeResult.code` | String | The decoded barcode value |
| `codeResult.format` | String | Barcode format (e.g., "code_128", "ean_13") |
| `codeResult.start` | Number | Start position in pattern |
| `codeResult.end` | Number | End position in pattern |
| `codeResult.direction` | Number | Scan direction (1 or -1) |
| `line` | Array | Two points defining the scan line |
| `angle` | Number | Barcode rotation angle (radians) |
| `pattern` | Array | Binary pattern (0=space, 1=bar) |
| `box` | Array | Bounding box coordinates (4 corner points) |
| `boxes` | Array | All candidate boxes found during localization |

> **Important: Coordinate System**
>
> The `box`, `boxes`, and `line` coordinates are returned in **processed canvas coordinates**, not original image/video coordinates. If you're using `inputStream.size` to scale the processing resolution (e.g., for performance), you'll need to scale these coordinates to match your original video/image dimensions.
>
> ```javascript
> // Scale coordinates to original video size
> const scaleX = video.videoWidth / Quagga.canvas.dom.image.width;
> const scaleY = video.videoHeight / Quagga.canvas.dom.image.height;
> const scaledBox = result.box.map(p => [p[0] * scaleX, p[1] * scaleY]);
> ```
>
> See [Working with Box Coordinates](../how-to-guides/working-with-coordinates.md) for complete examples.

### Checking for Successful Detection

```javascript
Quagga.onDetected(function(result) {
  // Always check if codeResult exists
  if (result && result.codeResult && result.codeResult.code) {
    console.log("Detected:", result.codeResult.code);
  }
});
```

### Using Multiple Barcode Detection

When `decoder.multiple` is `true`, results are returned as an array:

```javascript
Quagga.init({
  decoder: {
    readers: ["code_128_reader"],
    multiple: true
  }
});

Quagga.onDetected(function(result) {
  // result is an array of result objects
  result.forEach(function(item) {
    if (item.codeResult) {
      console.log("Code:", item.codeResult.code);
      console.log("Box:", item.box);
    }
  });
});
```

## Canvas Access

Quagga automatically creates and manages two canvas elements for visualization. These are positioned over the video/image stream and sized to match the processing dimensions.

### Canvas Structure

```javascript
Quagga.canvas = {
  dom: {
    image: HTMLCanvasElement,           // Canvas for processed image data
    overlay: HTMLCanvasElement | null   // Transparent canvas for drawing overlays
  },
  ctx: {
    image: CanvasRenderingContext2D,           // Context for image canvas
    overlay: CanvasRenderingContext2D | null   // Context for overlay canvas
  }
};
```

> **Note**: The overlay canvas can be `null` if `canvas.createOverlay` is set to `false` in the configuration. See [Canvas Configuration](configuration.md#canvas-configuration) for details.

### Overlay Canvas

The **overlay canvas** (`Quagga.canvas.dom.overlay`) is a transparent canvas element positioned over the video stream. It's automatically created when Quagga initializes (unless `canvas.createOverlay` is `false`) and is designed for drawing bounding boxes, scan lines, and other visual feedback.

**Key characteristics:**
- Has CSS class `drawingBuffer`
- Sized to match the processed image dimensions (`inputStream.size`)
- Positioned absolutely over the video/image element
- Automatically appended to the viewport container
- Coordinates match the processed image space (no scaling needed)
- Can be disabled via `canvas.createOverlay: false` for performance

**Accessing the overlay:**
```javascript
const overlay = Quagga.canvas.dom.overlay;
const overlayCtx = Quagga.canvas.ctx.overlay;

// Always check if overlay exists before using
if (overlayCtx && overlay) {
  // Clear overlay
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  // Draw custom shapes
  overlayCtx.strokeStyle = "red";
  overlayCtx.lineWidth = 3;
  overlayCtx.strokeRect(10, 10, 100, 100);
}
```

### Image Canvas

The **image canvas** (`Quagga.canvas.dom.image`) contains the processed grayscale image data used for barcode detection. This is primarily for internal use and debugging.

**Key characteristics:**
- Has CSS class `imgBuffer`
- Contains the grayscale/processed image data
- Useful for debugging locator issues

### When to Use Each Canvas

| Use Case | Canvas to Use |
|----------|---------------|
| Drawing bounding boxes | `overlay` |
| Highlighting detected barcodes | `overlay` |
| Custom scan line visualization | `overlay` |
| Debugging image processing | `image` |
| Checking processed resolution | Either (they have same dimensions) |

### Important: Coordinate System

When drawing on the overlay canvas, use `result.box` and `result.boxes` coordinates directly - **no scaling is needed**. These coordinates are already in the overlay canvas's coordinate space.

```javascript
Quagga.onProcessed(function(result) {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;
  
  // Clear previous drawings
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw box directly - coordinates already match the overlay canvas
  if (result && result.box) {
    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, ctx, {
      color: "green", lineWidth: 2
    });
  }
});
```

> **Note**: Scaling is only needed when drawing on a **different** canvas (like a custom overlay on the original video element). See [Working with Box Coordinates](../how-to-guides/working-with-coordinates.md) for details.

### CSS Styling

The overlay canvas can be styled with CSS for positioning:

```css
/* Default positioning (handled automatically by Quagga) */
canvas.drawingBuffer {
  position: absolute;
  top: 0;
  left: 0;
}

/* Ensure proper stacking */
#scanner-container {
  position: relative;
}
```

## ImageDebug Helper

Quagga provides a helper for drawing debug visualizations:

```javascript
// Draw a path (array of points)
Quagga.ImageDebug.drawPath(points, offset, ctx, options);

// Example
Quagga.ImageDebug.drawPath(
  result.box,
  { x: 0, y: 1 },
  overlayCtx,
  { color: "green", lineWidth: 2 }
);
```

## Complete Example

```javascript
// Initialize
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner'),
    constraints: {
      width: 640,
      height: 480,
      facingMode: "environment"
    }
  },
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }

  // Start scanning
  Quagga.start();
});

// Handle detections
Quagga.onDetected(function(result) {
  console.log("Barcode detected:", result.codeResult.code);

  // Stop after first detection
  Quagga.stop();

  // Cleanup
  Quagga.offDetected();
  Quagga.offProcessed();
});

// Visualize processing
Quagga.onProcessed(function(result) {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (result && result.box) {
    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, ctx, {
      color: "green",
      lineWidth: 2
    });
  }
});

// Stop button
document.querySelector('#stop').addEventListener('click', function() {
  Quagga.stop();
  Quagga.offDetected();
  Quagga.offProcessed();
});
```

## Related

- [Configuration Reference](configuration.md) - Complete configuration options
- [CameraAccess API](camera-access.md) - Camera control methods
- [Supported Barcode Types](readers.md) - Available barcode readers
- [Getting Started](../getting-started.md) - Basic usage examples

---

[← Back to Reference](index.md)
