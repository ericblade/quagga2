# How to Use Debug Flags {#how-to-use-debug-flags}

Quagga2 includes several debug flags that enable diagnostic console output to help troubleshoot issues with barcode detection and decoding. This guide explains when and how to use them.

## Overview {#overview}

Debug flags control what information Quagga2 logs to the browser console. By default, **all debug output is suppressed** to keep your console clean. Enable specific flags when you need to diagnose problems.

## Important Note {#important-note}

Debug flags only work when `ENV.development` is `true` (development builds). Production builds strip out all debug code to minimize bundle size.

## Available Debug Flags {#available-debug-flags}

Debug flags are organized into three categories:

1. **Console logging flags** - Print diagnostic information to the console
2. **Visual canvas overlays** - Draw debugging information on the canvas
3. **Performance analysis** - Display frequency and pattern data

### Console Logging Flags {#console-logging-flags}

#### `inputStream.debug.showImageDetails` {#inputstream-debug-showimagedetails}

**What it shows**: Image loading and frame grabber operations

**Console output example**:

```text
*** frame_grabber_browser: willReadFrequency=undefined canvas=<canvas>
Image Loader: Loaded 3 images from /path/to/image.jpg
```

**When to use**:

- Camera feed not showing
- Images not loading from file input
- Canvas-related issues

**How to enable**:

```javascript
Quagga.init({
  inputStream: {
    // ... your input config
    debug: {
      showImageDetails: true
    }
  },
  // ... rest of config
});
```

#### `decoder.debug.printReaderInfo` {#decoder-debug-printreaderinfo}

**What it shows**: Barcode reader registration and initialization

**Console output example**:

```text
* ImageWrapper getCanvasAndContext
Registering reader: code_128_reader
Before registering reader: EANReader
Registered Readers: code_128, ean
```

**When to use**:

- Verifying which readers are active
- Reader not detecting expected barcode type
- Multiple reader configuration issues

**How to enable**:

```javascript
Quagga.init({
  decoder: {
    readers: ["code_128_reader", "ean_reader"],
    debug: {
      printReaderInfo: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showPatchSize` {#locator-debug-showpatchsize}

**What it shows**: Patch dimensions during barcode localization

**Console output example**:

```text
Patch-Size: 320x240
```

**When to use**:

- Barcode locator not finding barcodes
- Understanding what image size the locator is processing
- Performance optimization (smaller patches = faster)

**How to enable**:

```javascript
Quagga.init({
  locator: {
    patchSize: "medium",
    debug: {
      showPatchSize: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showImageDetails` {#locator-debug-showimagedetails}

**What it shows**: Canvas and image wrapper initialization for locator

**Console output example**:

```text
* initCanvas getCanvasAndContext
* ImageWrapper getCanvasAndContext
```

**When to use**:

- Locator canvas not rendering
- Debugging locator initialization failures
- Understanding when canvas contexts are created

**How to enable**:

```javascript
Quagga.init({
  locator: {
    // ... your locator config
    debug: {
      showImageDetails: true
    }
  },
  // ... rest of config
});
```

### Visual Canvas Overlay Flags {#visual-canvas-overlay-flags}

These flags draw debugging information directly on the canvas, allowing you to visualize the barcode detection algorithm's internal state.

Note: The scan area overlay (defined via `inputStream.area`) is not a debug flag. When `locate: false`, Quagga draws the scan area on the overlay canvas each processed frame. You can also draw it manually using `Quagga.drawScannerArea()`. See the [Configuration Reference](../reference/configuration.md#inputstream-area-drawing) and [API](../reference/api.md#quagga-drawscannerarea).

#### `decoder.debug.drawBoundingBox` {#decoder-debug-drawboundingbox}

**What it shows**: Draws a box around the detected barcode location

**When to use**:

- Verify barcode is being located correctly
- Debug positioning issues
- Understand where the decoder thinks the barcode is

**How to enable**:

```javascript
Quagga.init({
  decoder: {
    debug: {
      drawBoundingBox: true
    }
  },
  // ... rest of config
});
```

#### `decoder.debug.drawScanline` {#decoder-debug-drawscanline}

**What it shows**: Draws the scanline path used for decoding

**When to use**:

- Verify scanner is reading through the barcode correctly
- Debug angle/orientation issues
- Understand why certain barcodes fail to decode

**How to enable**:

```javascript
Quagga.init({
  decoder: {
    debug: {
      drawScanline: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showCanvas` {#locator-debug-showcanvas}

**What it shows**: Displays the locator's internal canvas used for image processing

**When to use**:

- Debug localization algorithm
- Verify image preprocessing is working
- Understand what the locator "sees"

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showCanvas: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showPatches` {#locator-debug-showpatches}

**What it shows**: Draws all patches extracted during the localization phase

**When to use**:

- Debug patch extraction issues
- Verify patch size is appropriate
- Understand what regions are being analyzed

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showPatches: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showFoundPatches` {#locator-debug-showfoundpatches}

**What it shows**: Highlights patches where potential barcodes were found

**When to use**:

- Verify barcode candidates are being identified
- Debug false positives/negatives in patch detection
- Optimize patch threshold settings

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showFoundPatches: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showSkeleton` {#locator-debug-showskeleton}

**What it shows**: Displays the skeleton structure extracted from patches

**When to use**:

- Debug advanced localization algorithm
- Understand structure detection
- Verify skeleton extraction is working

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showSkeleton: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showLabels` {#locator-debug-showlabels}

**What it shows**: Displays component labels during connected component analysis

**When to use**:

- Debug component labeling phase
- Verify components are being identified correctly
- Understand clustering behavior

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showLabels: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showPatchLabels` {#locator-debug-showpatchlabels}

**What it shows**: Shows labels assigned to individual patches

**When to use**:

- Debug patch classification
- Verify patches are being labeled correctly
- Understand patch grouping

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showPatchLabels: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.showRemainingPatchLabels` {#locator-debug-showremainingpatchlabels}

**What it shows**: Displays labels for patches remaining after filtering

**When to use**:

- Debug patch filtering logic
- Verify correct patches survive filtering
- Optimize filter thresholds

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      showRemainingPatchLabels: true
    }
  },
  // ... rest of config
});
```

#### `locator.debug.boxFromPatches.showTransformed` {#locator-debug-boxfrompatches-showtransformed}

**What it shows**: Shows transformed patch coordinates during box calculation

**When to use**:

- Debug coordinate transformation
- Verify spatial transformations are correct
- Understand box calculation from patches

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      boxFromPatches: {
        showTransformed: true
      }
    }
  },
  // ... rest of config
});
```

#### `locator.debug.boxFromPatches.showTransformedBox` {#locator-debug-boxfrompatches-showtransformedbox}

**What it shows**: Displays the bounding box after transformation

**When to use**:

- Debug box transformation
- Verify box coordinates after spatial transform
- Understand final box positioning

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      boxFromPatches: {
        showTransformedBox: true
      }
    }
  },
  // ... rest of config
});
```

#### `locator.debug.boxFromPatches.showBB` {#locator-debug-boxfrompatches-showbb}

**What it shows**: Displays the final bounding box around detected barcode region

**When to use**:

- Verify final bounding box is correct
- Debug box calculation from patches
- Optimize localization accuracy

**How to enable**:

```javascript
Quagga.init({
  locator: {
    debug: {
      boxFromPatches: {
        showBB: true
      }
    }
  },
  // ... rest of config
});
```

### Performance Analysis Flags {#performance-analysis-flags}

#### `decoder.debug.showFrequency` {#decoder-debug-showfrequency}

**What it shows**: Displays frequency data from the barcode scanline

**When to use**:

- Analyze barcode signal quality
- Debug decoding issues at the signal level
- Understand why certain barcodes fail to decode

**How to enable**:

```javascript
Quagga.init({
  decoder: {
    debug: {
      showFrequency: true
    }
  },
  // ... rest of config
});
```

#### `decoder.debug.showPattern` {#decoder-debug-showpattern}

**What it shows**: Displays the pattern data extracted from the barcode

**When to use**:

- Analyze pattern recognition issues
- Debug specific barcode format problems
- Understand pattern extraction process

**How to enable**:

```javascript
Quagga.init({
  decoder: {
    debug: {
      showPattern: true
    }
  },
  // ... rest of config
});
```

## Common Debugging Scenarios {#common-debugging-scenarios}

### "No barcodes detected" {#no-barcodes-detected}

Enable console logging first, then add visual overlays if needed:

```javascript
Quagga.init({
  inputStream: {
    target: document.querySelector('#scanner'),
    debug: {
      showImageDetails: true
    }
  },
  decoder: {
    readers: ["code_128_reader"],
    debug: {
      printReaderInfo: true,
      drawBoundingBox: true,  // Visual: see if barcode is located
      drawScanline: true       // Visual: see scan path
    }
  },
  locator: {
    debug: {
      showPatchSize: true,
      showImageDetails: true,
      showFoundPatches: true   // Visual: see candidate patches
    }
  }
}, function(err) {
  if (err) {
    console.error("Init error:", err);
    return;
  }
  console.log("Starting Quagga...");
  Quagga.start();
});
```

Check console for:

- ✅ Readers registered correctly?
- ✅ Images loading?
- ✅ Patch size reasonable (not 0x0)?
- ✅ Canvas contexts created?

Check canvas overlay for:

- ✅ Are patches being detected? (green highlights)
- ✅ Is a bounding box drawn?
- ✅ Is the scanline visible and passing through the barcode?

### "Camera not working" {#camera-not-working}

Enable input stream debugging:

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    debug: {
      showImageDetails: true  // Shows camera/canvas setup
    }
  },
  // ... rest of config
});
```

### "Wrong barcode type detected" {#wrong-barcode-type}

Enable reader info to verify configuration:

```javascript
Quagga.init({
  decoder: {
    readers: [
      "code_128_reader",  // Did you enable the right readers?
      "ean_reader"
    ],
    debug: {
      printReaderInfo: true  // Shows which readers are active
    }
  },
  // ... rest of config
});
```

### "Deep-dive localization debugging" {#deep-dive-debugging}

For advanced debugging of the localization algorithm, enable all visual overlays:

```javascript
Quagga.init({
  locator: {
    debug: {
      showCanvas: true,
      showPatches: true,
      showFoundPatches: true,
      showSkeleton: true,
      showLabels: true,
      showPatchLabels: true,
      showRemainingPatchLabels: true,
      boxFromPatches: {
        showTransformed: true,
        showTransformedBox: true,
        showBB: true
      }
    }
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  Quagga.start();
});
```

This will display every step of the localization process visually on the canvas. Use this to:

- Understand the complete localization pipeline
- Optimize patch size and thresholds
- Debug complex barcode positioning issues
- Learn how the algorithm works

**Warning**: Enabling all visual overlays may impact performance and make the canvas cluttered. Enable only what you need.

## Performance Impact {#performance-impact}

Debug flags have varying performance impacts:

**Console logging flags** (minimal impact):

- `showImageDetails`, `printReaderInfo`, `showPatchSize` - negligible overhead
- Only execute when enabled and only in development builds

**Visual canvas overlays** (moderate to high impact):

- Drawing operations on canvas can slow down real-time detection
- More overlays = more draw calls = slower performance
- Consider disabling in production or using only for development/debugging

**Performance analysis flags** (high impact):

- `showFrequency`, `showPattern` - can generate large amounts of data
- Best used sparingly when diagnosing specific decoding issues

**Recommendation**: Enable only the flags you need. Disable all visual overlays for production.

## Disabling Debug Output {#disabling-debug-output}

To turn off all debug output, either:

**Option 1**: Remove debug properties entirely

```javascript
Quagga.init({
  inputStream: {
    // debug property removed
  },
  // ...
});
```

**Option 2**: Set flags to `false`

```javascript
Quagga.init({
  inputStream: {
    debug: {
      showImageDetails: false
    }
  },
  decoder: {
    debug: {
      printReaderInfo: false,
      drawBoundingBox: false,
      drawScanline: false,
      showFrequency: false,
      showPattern: false
    }
  },
  locator: {
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
});
```

## Using in Node.js {#using-in-nodejs}

Debug flags work in Node.js too! Output goes to `console.log`:

```javascript
const Quagga = require('@ericblade/quagga2').default;

Quagga.decodeSingle({
  src: './barcode.jpg',
  decoder: {
    readers: ['code_128_reader'],
    debug: {
      printReaderInfo: true  // Shows reader registration
    }
  }
}, (result) => {
  // Check console for debug output
  if (result) {
    console.log('Decoded:', result.codeResult.code);
  }
});
```

## Development vs Production {#development-vs-production}

**Development builds** (`dist/quagga.js` or when using webpack dev server):

- Debug flags work
- Console output visible
- Larger file size

**Production builds** (`dist/quagga.min.js`):

- Debug flags are stripped out (no-op)
- No console output
- Smaller file size

To enable debug output in production:

1. Use the development build (`quagga.js` instead of `quagga.min.js`)
2. Set `ENV.development = true` before importing Quagga

## Summary {#summary}

Quagga2 provides **19 debug flags** organized into three categories:

**Console logging** (4 flags) - Minimal performance impact:

- `inputStream.debug.showImageDetails` - Frame grabber and image loading
- `decoder.debug.printReaderInfo` - Reader registration
- `locator.debug.showPatchSize` - Patch dimensions
- `locator.debug.showImageDetails` - Canvas initialization

**Visual canvas overlays** (13 flags) - Moderate to high performance impact:

- `decoder.debug.drawBoundingBox` - Barcode location box
- `decoder.debug.drawScanline` - Scan path
- `locator.debug.showCanvas` - Locator's internal canvas
- `locator.debug.showPatches` - All extracted patches
- `locator.debug.showFoundPatches` - Candidate patches
- `locator.debug.showSkeleton` - Skeleton structure
- `locator.debug.showLabels` - Component labels
- `locator.debug.showPatchLabels` - Patch labels
- `locator.debug.showRemainingPatchLabels` - Post-filter labels
- `locator.debug.boxFromPatches.showTransformed` - Transformed coordinates
- `locator.debug.boxFromPatches.showTransformedBox` - Transformed box
- `locator.debug.boxFromPatches.showBB` - Final bounding box

**Performance analysis** (2 flags) - High impact:

- `decoder.debug.showFrequency` - Signal frequency data
- `decoder.debug.showPattern` - Pattern extraction data

**Debugging strategy**: Start with console logging flags, then add visual overlays as needed. Disable all flags in production.

## Related {#related}

- [Configuration Reference](../reference/configuration.md) - Complete config documentation
- [Optimize Performance](optimize-performance.md) - Speed up barcode detection
- [Handle Difficult Barcodes](handle-difficult-barcodes.md) - Improve detection accuracy

## Changelog {#changelog}

**v1.8.4+** (November 2025): Debug flags introduced to replace always-on console spam

Prior versions logged debug information unconditionally, making it difficult to debug application code. The new flag system provides fine-grained control over diagnostic output.

---

**Questions?** Ask in [Gitter Chat](https://gitter.im/quaggaJS/Lobby) or [open an issue](https://github.com/ericblade/quagga2/issues).
