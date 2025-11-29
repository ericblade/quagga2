# Decoding Static Images {#static-image}

This tutorial shows how to decode barcodes from image files instead of a live camera feed.

## Basic Usage {#basic-usage}

Use `Quagga.decodeSingle()` to decode a single image:

```javascript
Quagga.decodeSingle({
  src: '/path/to/barcode.jpg',
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Barcode:", result.codeResult.code);
  } else {
    console.log("No barcode found");
  }
});
```

## From File Input {#from-file-input}

Allow users to upload images:

### HTML

```html
<input type="file" id="file-input" accept="image/*">
<div id="result"></div>
```

### JavaScript

```javascript
document.querySelector('#file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    Quagga.decodeSingle({
      src: event.target.result,
      decoder: {
        readers: ["code_128_reader", "ean_reader", "upc_reader"]
      }
    }, function(result) {
      if (result && result.codeResult) {
        document.querySelector('#result').textContent = 
          "Found: " + result.codeResult.code;
      } else {
        document.querySelector('#result').textContent = "No barcode found";
      }
    });
  };
  reader.readAsDataURL(file);
});
```

## Controlling Image Size {#controlling-image-size}

By default, `decodeSingle()` scales images to 800px. Adjust with `inputStream.size`:

```javascript
Quagga.decodeSingle({
  src: '/path/to/image.jpg',
  inputStream: {
    size: 1280  // Process at higher resolution
  },
  decoder: {
    readers: ["ean_reader"]
  }
}, callback);
```

Set `size: 0` to use original image dimensions.

## With Localization {#with-localization}

Enable `locate: true` (default) to find barcodes anywhere in the image:

```javascript
Quagga.decodeSingle({
  src: '/path/to/image.jpg',
  locate: true,
  locator: {
    patchSize: "medium",
    halfSample: true
  },
  decoder: {
    readers: ["code_128_reader"]
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Found:", result.codeResult.code);
    console.log("Location:", result.box);  // Bounding box
  }
});
```

## Node.js Usage {#nodejs-usage}

Quagga2 works in Node.js:

```javascript
const Quagga = require('@ericblade/quagga2').default;

Quagga.decodeSingle({
  src: './barcode.jpg',
  decoder: {
    readers: ["code_128_reader"]
  }
}, function(result) {
  if (result && result.codeResult) {
    console.log("Barcode:", result.codeResult.code);
  }
});
```

## Related {#related}

- [Your First Scan](first-scan.md) - Live camera scanning
- [Node.js Usage](node-usage.md) - Server-side scanning
- [API Reference](../reference/api.md#quagga-decodesingle) - `decodeSingle()` details

---

[← Back to Tutorials](index.md)
