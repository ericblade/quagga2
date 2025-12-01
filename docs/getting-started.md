# Getting Started with Quagga2 {#getting-started}

This guide will help you install Quagga2 and get your first barcode scanner running quickly.

## What is Quagga2? {#what-is-quagga2}

Quagga2 is a JavaScript barcode scanner library that works in both browsers and Node.js. It can:

- **Scan barcodes in real-time** using your device's camera
- **Decode barcodes from images** (photos, screenshots, etc.)
- **Support multiple formats**: EAN, CODE 128, CODE 39, EAN 8, UPC-A, UPC-C, I2of5, 2of5, CODE 93, CODE 32, CODABAR, and PHARMACODE
- **Work offline** - all processing happens in the browser/Node.js, no server required

Unlike some libraries, Quagga2 includes a barcode **locator** that can find and decode barcodes regardless of their rotation or scale in the image.

## Installation {#installation}

### Using NPM (Recommended) {#using-npm}

```bash
npm install --save @ericblade/quagga2
```

Then import it in your project:

```javascript
// ES6 modules
import Quagga from '@ericblade/quagga2';

// CommonJS (important: note the .default)
const Quagga = require('@ericblade/quagga2').default;
```

### Using CDN (Script Tag) {#using-cdn}

Add one of these script tags to your HTML:

**Unminified version** (useful for development):

```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.js"></script>
```

**Minified version** (recommended for production):

```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
```

**Specific version** (recommended to avoid breaking changes):

```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js"></script>
```

The script tag exposes the library globally as `Quagga`.

## Basic Usage - Live Camera Scanning {#live-camera-scanning}

Here's a minimal example to scan barcodes using your device's camera:

### HTML {#html-example}

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quagga2 Barcode Scanner</title>
</head>
<body>
  <div id="scanner-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

### JavaScript (app.js) {#javascript-example}

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner-container')
  },
  decoder: {
    readers: ["code_128_reader"]
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Initialization finished. Ready to start");
  Quagga.start();
});

Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  console.log("Barcode detected:", code);
  alert("Found barcode: " + code);
});
```

That's it! This will:

1. Request camera access
2. Display the camera feed in `#scanner-container`
3. Continuously scan for CODE 128 barcodes
4. Alert you when a barcode is detected

## Basic Usage - Static Image Scanning {#static-image-scanning}

To decode a barcode from an existing image:

```javascript
Quagga.decodeSingle({
  src: "path/to/your/image.jpg",
  decoder: {
    readers: ["code_128_reader"]
  }
  // Note: Images are scaled to 800px (longest side) by default.
  // See inputStream.size in the Configuration Reference for details.
}, function(result) {
  if (result && result.codeResult) {
    console.log("Barcode found:", result.codeResult.code);
  } else {
    console.log("No barcode found");
  }
});
```

## Important Notes {#important-notes}

### HTTPS Required {#https-required}

For security reasons, browsers require **HTTPS** to access the camera, except on `localhost`. If you host your app on a domain, you must use `https://`.

### Browser Compatibility {#browser-compatibility}

Quagga2 works in modern browsers that support:

- Canvas API
- Typed Arrays
- MediaDevices API (for camera access)

See the [Browser Support](reference/browser-support.md) page for detailed compatibility information.

### Polyfill Recommendation {#polyfill-recommendation}

Different browsers implement camera APIs differently. We recommend including [webrtc-adapter](https://github.com/webrtc/adapter) for better compatibility:

```html
<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
```

## Next Steps {#next-steps}

Now that you have the basics working:

- **[Try a complete tutorial](tutorials/first-scan.md)** - Build a working barcode scanner step-by-step
- **[Learn about configuration options](reference/configuration.md)** - Customize behavior
- **[Explore supported barcode types](reference/readers.md)** - Enable different formats
- **[Check out live examples](https://serratus.github.io/quaggaJS/examples)** - See Quagga2 in action

## Common Issues {#common-issues}

### Camera Permission Denied {#camera-permission-denied}

If the user denies camera access, the `init` callback will receive an error. Always handle this gracefully:

```javascript
Quagga.init(config, function(err) {
  if (err) {
    if (err.name === 'NotAllowedError') {
      alert('Please allow camera access to scan barcodes');
    }
    console.error(err);
    return;
  }
  Quagga.start();
});
```

### Camera Not Found {#camera-not-found}

Some devices don't have a camera (desktops, VMs). Check for camera availability:

```javascript
if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  // Camera API available
  Quagga.init(config, callback);
} else {
  // Fallback to file upload
  alert('Camera not available, please upload an image');
}
```

### No Barcode Detected {#no-barcode-detected}

If Quagga2 isn't detecting your barcode:

- Make sure you've enabled the correct reader (e.g., `ean_reader` for EAN-13)
- Ensure good lighting
- Try holding the barcode steady and filling most of the camera view
- See [How to Handle Difficult Barcodes](how-to-guides/handle-difficult-barcodes.md)

## Getting Help {#getting-help}

- **[GitHub Issues](https://github.com/ericblade/quagga2/issues)** - Report bugs or request features
- **[Gitter Chat](https://gitter.im/quaggaJS/Lobby)** - Ask questions and get help from the community
- **[API Documentation](reference/api.md)** - Complete API reference
