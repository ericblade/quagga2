# Configuration Reference

Complete reference for all Quagga2 configuration options.

## Configuration Object Structure

The configuration object passed to `Quagga.init()` defines all aspects of barcode detection and decoding:

```javascript
{
  locate: true,
  inputStream: { ... },
  frequency: 10,
  decoder: { ... },
  locator: { ... },
  debug: false
}
```

## Top-Level Properties

### `locate`

**Type**: `boolean`

**Default**: `true`

**Description**: Controls whether Quagga attempts to locate the barcode in the image.

**When to use `true`** (default):

- Barcode position is unknown
- Barcode can be anywhere in the frame
- Barcode may be rotated
- Best accuracy for varied conditions

**When to use `false`**:

- Barcode position is fixed and known
- Using a guide/overlay to position barcode
- Performance is critical
- Barcode is always centered and aligned
- Device lacks auto-focus (blurry images make localization unstable)

**Example**:

```javascript
Quagga.init({
  locate: false,  // Expect barcode in center
  inputStream: {
    area: {  // Define scan area
      top: "25%",
      right: "25%",
      left: "25%",
      bottom: "25%"
    }
  }
});
```

**Performance Impact**: Disabling `locate` significantly improves performance but requires barcode to be properly positioned.

### `inputStream`

**Type**: `object`

**Description**: Defines the source of images/video for barcode detection.

See [inputStream Configuration](#inputstream-configuration) below for complete details.

### `frequency`

**Type**: `number` (optional)

**Default**: unlimited

**Description**: Maximum scans per second. Controls how often frames are processed.

**Example**:

```javascript
Quagga.init({
  frequency: 10  // Process max 10 frames per second
});
```

**Use cases**:

- Limit CPU usage on long-running sessions
- Reduce battery drain on mobile devices
- Throttle processing when high frame rate isn't needed

### `decoder`

**Type**: `object`

**Description**: Configuration for barcode decoding.

See [Decoder Configuration](#decoder-configuration) below for complete details.

### `locator`

**Type**: `object`

**Description**: Configuration for barcode localization algorithm.

See [Locator Configuration](#locator-configuration) below for complete details.

### `debug`

**Type**: `boolean`

**Default**: `false`

**Description**: Enables global debug mode. When `true` and running development build:

- Enables additional logging
- Allows visual debug flags to work

**Note**: More fine-grained debug control is available via `inputStream.debug`, `decoder.debug`, and `locator.debug`. See [Debug Flags Guide](../how-to-guides/use-debug-flags.md).

## inputStream Configuration

Controls the source and properties of the image/video stream.

### inputStream Structure

```javascript
inputStream: {
  type: "LiveStream",
  target: document.querySelector('#scanner'),  // or '#scanner'
  constraints: {
    width: 640,
    height: 480,
    facingMode: "environment",
    deviceId: "abc123...",
    aspectRatio: 1.333
  },
  area: {
    top: "0%",
    right: "0%",
    left: "0%",
    bottom: "0%"
  },
  singleChannel: false,
  debug: {
    showImageDetails: false
  }
}
```

### `inputStream.type`

**Type**: `string`

**Options**: `"LiveStream"` | `"VideoStream"` | `"ImageStream"`

**Description**: Type of input source.

**LiveStream** (default):

- Uses `getUserMedia` for live camera
- Real-time barcode scanning
- Requires camera permission

**VideoStream**:

- Processes a pre-recorded video file
- Useful for testing

**ImageStream**:

- Processes static images
- Can use file paths or data URLs

### `inputStream.target`

**Type**: `HTMLElement | string`

**Description**: DOM element or CSS selector where Quagga renders the video/canvas.

**Examples**:

```javascript
// Direct element reference
target: document.querySelector('#scanner-container')

// CSS selector
target: '#scanner-container'

// Default if omitted: '#interactive.viewport'
```

### `inputStream.constraints`

**Type**: `object`

**Description**: MediaStream constraints for camera selection and configuration. Follows [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) spec.

**Common Properties**:

```javascript
constraints: {
  width: { ideal: 1280 },      // Preferred width
  height: { ideal: 720 },      // Preferred height
  facingMode: "environment",    // "user" (front) or "environment" (back)
  deviceId: "abc123...",        // Specific camera by ID
  aspectRatio: { ideal: 1.777 } // 16:9 aspect ratio
}
```

**Constraint Types**:

```javascript
// Exact value (strict)
width: { exact: 1920 }

// Ideal value (preferred, not required)
width: { ideal: 1920 }

// Range
width: { min: 640, max: 1920 }

// Simple value (treated as ideal)
width: 1280
```

**facingMode**:

- `"user"` - Front-facing camera (selfie camera)
- `"environment"` - Back-facing camera (main camera)
- `{ exact: "environment" }` - Require specific camera (fails if unavailable)

**Example - High Resolution**:

```javascript
constraints: {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: "environment"
}
```

**Example - Specific Camera**:

```javascript
// First, enumerate devices
const devices = await Quagga.CameraAccess.enumerateVideoDevices();
const backCamera = devices.find(d => d.label.includes('back'));

// Then use deviceId
constraints: {
  deviceId: { exact: backCamera.deviceId }
}
```

### `inputStream.area`

**Type**: `object`

**Description**: Defines rectangular region for detection/localization as percentage offsets.

**Structure**:

```javascript
area: {
  top: "0%",     // Offset from top
  right: "0%",   // Offset from right
  left: "0%",    // Offset from left
  bottom: "0%"   // Offset from bottom
}
```

**Example - Center Rectangle**:

```javascript
area: {
  top: "25%",
  right: "25%",
  left: "25%",
  bottom: "25%"
}
// Results in a 50% x 50% rectangle in the center
```

**Use cases**:

- Restrict scanning to specific area
- Guide user with overlay
- Improve performance by processing less pixels
- Required when `locate: false` to define scan region

### `inputStream.singleChannel`

**Type**: `boolean`

**Default**: `false`

**Description**: When `true`, only reads the red color channel instead of converting to grayscale.

**Use cases**:

- Debugging decoder issues
- Used with ResultCollector for analysis
- Not recommended for normal use

### `inputStream.size`

**Type**: `number` (for `decodeSingle` only)

**Default**: Original image dimensions (when omitted)

**Description**: When using `decodeSingle` with file paths, scales the input image so that the longest side (width or height) equals this value, maintaining aspect ratio. When omitted, the original image dimensions are used without any scaling.

**Note on Scaling**: This parameter scales images both up and down. While upscaling typically introduces interpolation artifacts, testing has shown that moderate upscaling can actually **improve** barcode detection accuracy, even with `halfSample:false`. The benefits include:

- **More pixels per bar**: Upscaling provides more pixel data for the locator to analyze
- **Interpolation smoothing**: Acts as a smoothing filter that can reduce noise and compression artifacts
- **Integer scaling**: 2x scaling provides clean pixel doubling with minimal artifacts
- **Works with both halfSample modes**: Benefits seen in both halfSample:true and halfSample:false

**Scaling Guidelines**:

- Start with **2x the original image size** (e.g., 1100px → 2200px) for testing
- Try 1.25x-1.5x if 2x doesn't work well
- Performance typically peaks at moderate upscaling (1.25x-2x range)
- Performance degrades beyond 2.5x due to excessive interpolation artifacts
- Optimal scaling depends on image quality, compression, and barcode size/condition - not necessarily barcode type

**Recommended approach**: Experiment with different scaling factors. Start with 2x (e.g., 1600-2200 for typical barcode images), then try lower values if needed. The optimal value varies by image content and quality.

**Example**:

```javascript
// Scale down a large image
Quagga.decodeSingle({
  src: "./large-image.jpg",  // 3000x2000 image
  inputStream: {
    size: 1600  // Scales down to 1600x1067
  }
});

// Use original image size (often a good starting point)
Quagga.decodeSingle({
  src: "./medium-image.jpg",  // 1280x720 image
  inputStream: {
    // No size specified - uses original 1280x720
  }
});

// Upscale for fine details (can improve detection)
Quagga.decodeSingle({
  src: "./small-barcode.jpg",  // 1100x658 image with fine barcode
  inputStream: {
    size: 1600  // Scales up to 1600x957, may improve detection
  }
});
```

**Performance Note**: Higher values increase processing time. Balance detection accuracy against speed based on your use case. Test different values to find the optimal setting for your specific images.

### `inputStream.debug`

**Type**: `object`

**Description**: Enable console logging for input stream diagnostics.

```javascript
debug: {
  showImageDetails: false  // Log frame grabber operations
}
```

See [Debug Flags Guide](../how-to-guides/use-debug-flags.md) for details.

## Decoder Configuration

Controls barcode detection and decoding behavior.

### Decoder Structure

```javascript
decoder: {
  readers: ["code_128_reader"],
  debug: {
    drawBoundingBox: false,
    showFrequency: false,
    drawScanline: false,
    showPattern: false,
    printReaderInfo: false
  },
  multiple: false
}
```

### `decoder.readers`

**Type**: `Array<string | object>`

**Required**: Yes

**Description**: Array of barcode reader types to use.

**Available Readers**:

- `code_128_reader` - Code 128
- `ean_reader` - EAN-13
- `ean_8_reader` - EAN-8
- `code_39_reader` - Code 39
- `code_39_vin_reader` - Code 39 VIN
- `codabar_reader` - Codabar
- `upc_reader` - UPC-A
- `upc_e_reader` - UPC-E
- `i2of5_reader` - Interleaved 2 of 5
- `2of5_reader` - Standard 2 of 5
- `code_93_reader` - Code 93
- `code_32_reader` - Code 32 (Italian Pharmacode)

See [Supported Barcode Types](readers.md) for complete details.

**Simple Example**:

```javascript
readers: ["code_128_reader", "ean_reader"]
```

**With Configuration** (e.g., EAN extensions):

```javascript
readers: [
  "ean_reader",  // Regular EAN without extensions
  {
    format: "ean_reader",
    config: {
      supplements: ['ean_5_reader', 'ean_2_reader']
    }
  }  // EAN with 2 or 5 digit extensions
]
```

**Important**: Order matters! List most common formats first for better performance.

### `decoder.debug`

**Type**: `object`

**Description**: Enable visual debug overlays and console logging for decoder.

```javascript
debug: {
  drawBoundingBox: false,    // Draw box around detected barcode
  showFrequency: false,      // Display frequency data
  drawScanline: false,       // Draw the scan line
  showPattern: false,        // Display pattern data
  printReaderInfo: false     // Log reader registration to console
}
```

See [Debug Flags Guide](../how-to-guides/use-debug-flags.md) for details.

### `decoder.multiple`

**Type**: `boolean`

**Default**: `false`

**Description**: When `true`, continues decoding after finding a barcode to detect multiple barcodes in a single image.

**Example**:

```javascript
decoder: {
  readers: ["code_128_reader"],
  multiple: true
}
```

**Result format**: When `true`, the result is an array of result objects:

```javascript
Quagga.onDetected(function(results) {
  // results is an array
  results.forEach(function(result) {
    if (result.codeResult) {
      console.log("Found:", result.codeResult.code);
    }
  });
});
```

## Locator Configuration

Controls the barcode localization algorithm. Only relevant when `locate: true`.

### Locator Structure

```javascript
locator: {
  halfSample: true,
  patchSize: "medium",
  debug: {
    showCanvas: false,
    showPatches: false,
    showFoundPatches: false,
    showSkeleton: false,
    showLabels: false,
    showPatchLabels: false,
    showRemainingPatchLabels: false,
    showPatchSize: false,
    showImageDetails: false,
    boxFromPatches: {
      showTransformed: false,
      showTransformedBox: false,
      showBB: false
    }
  }
}
```

### `locator.halfSample`

**Type**: `boolean`

**Default**: `true`

**Description**: When `true`, operates on image scaled to half width/height (quarter pixel count).

**Benefits of `true`** (recommended):

- Significantly faster processing
- Implicit smoothing helps find barcodes
- Reduces noise

**When to use `false`**:

- Barcodes are very small
- Need full resolution to detect fine details
- Have high-resolution camera and need every pixel

**Recommendation**: Keep `true` and increase camera resolution if needed, rather than disabling half-sampling.

### `locator.patchSize`

**Type**: `string`

**Options**: `"x-small"` | `"small"` | `"medium"` | `"large"` | `"x-large"`

**Default**: `"medium"`

**Description**: Controls search grid density. Affects how the locator divides the image for analysis.

**Size Guidelines**:

| Patch Size | Barcode Distance | Use Case |
|------------|------------------|----------|
| `x-small` | Far away | Small barcodes, poor focus, low resolution |
| `small` | Moderately far | Small to medium barcodes |
| `medium` | Normal | General purpose (recommended default) |
| `large` | Close up | Large barcodes held close to camera |
| `x-large` | Very close | Very large barcodes, macro shots |

**Relationship to Resolution**:

- Smaller patches = denser search grid = slower but finds smaller barcodes
- Larger patches = coarser search grid = faster but may miss small barcodes

**Example - Small Distant Barcodes**:

```javascript
locator: {
  patchSize: "small",
  halfSample: true  // Keep half-sampling on
},
inputStream: {
  constraints: {
    width: { ideal: 1280 },  // Higher resolution compensates
    height: { ideal: 720 }
  }
}
```

**Example - Large Close-Up Barcodes**:

```javascript
locator: {
  patchSize: "large",
  halfSample: true
}
```

### `locator.debug`

**Type**: `object`

**Description**: Enable visual debug overlays and console logging for locator.

**Console logging flags**:

```javascript
debug: {
  showPatchSize: false,      // Log calculated patch dimensions
  showImageDetails: false    // Log image wrapper and canvas details
}
```

**Visual overlay flags**:

```javascript
debug: {
  showCanvas: false,                 // Show locator's internal canvas
  showPatches: false,                // Draw all extracted patches
  showFoundPatches: false,           // Highlight candidate patches
  showSkeleton: false,               // Show skeleton structure
  showLabels: false,                 // Show component labels
  showPatchLabels: false,            // Show patch labels
  showRemainingPatchLabels: false,   // Show post-filter labels
  boxFromPatches: {
    showTransformed: false,          // Show transformed coordinates
    showTransformedBox: false,       // Show transformed box
    showBB: false                    // Show final bounding box
  }
}
```

See [Debug Flags Guide](../how-to-guides/use-debug-flags.md) for complete details on all debug options.

## Complete Configuration Examples

### Example 1: Live Camera Scanning

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner'),
    constraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "environment"
    }
  },
  locate: true,
  frequency: 10,
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  },
  locator: {
    halfSample: true,
    patchSize: "medium"
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  Quagga.start();
});
```

### Example 2: Static Image Processing

```javascript
Quagga.decodeSingle({
  src: "/images/barcode.jpg",
  locate: true,
  decoder: {
    readers: ["code_128_reader"]
  },
  locator: {
    patchSize: "medium",
    halfSample: true
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Code:", result.codeResult.code);
  }
});
```

### Example 3: Guided Scanning (No Localization)

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: '#scanner',
    constraints: {
      width: 640,
      height: 480,
      facingMode: "environment"
    },
    area: {
      top: "30%",
      right: "20%",
      left: "20%",
      bottom: "30%"
    }
  },
  locate: false,  // Barcode must be centered in defined area
  decoder: {
    readers: ["ean_reader", "upc_reader"]
  }
});
```

### Example 4: Multiple Barcode Detection

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: '#scanner'
  },
  decoder: {
    readers: ["code_128_reader"],
    multiple: true  // Detect multiple barcodes per frame
  },
  locate: true,
  locator: {
    patchSize: "medium"
  }
});

Quagga.onDetected(function(results) {
  // results is an array when multiple: true
  console.log(`Found ${results.length} barcodes`);
  results.forEach(r => {
    if (r.codeResult) {
      console.log("Code:", r.codeResult.code);
    }
  });
});
```

### Example 5: Node.js Processing

```javascript
const Quagga = require('@ericblade/quagga2').default;

Quagga.decodeSingle({
  src: "./barcode.jpg",
  inputStream: {
    size: 800  // Scale to max 800px
  },
  locate: true,
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Detected:", result.codeResult.code);
  } else {
    console.log("No barcode found");
  }
});
```

## Configuration Best Practices

1. **Start simple**: Use defaults, only add specific readers you need
2. **Test thoroughly**: Different devices and lighting require different settings
3. **Optimize iteratively**: Start with `patchSize: "medium"`, adjust based on results
4. **Limit readers**: Only enable barcode formats you actually expect
5. **Consider performance**: Balance quality vs. speed based on use case
6. **Use constraints wisely**: Higher resolution helps but costs performance
7. **Debug systematically**: Enable debug flags to understand behavior

## Related

- [API Documentation](api.md) - How to use Quagga methods
- [Supported Barcode Types](readers.md) - Available readers
- [Browser Support](browser-support.md) - Compatibility information
- [Debug Flags Guide](../how-to-guides/use-debug-flags.md) - Diagnostic tools

---

[← Back to Reference](index.md)
