# Your First Barcode Scan {#first-scan}

This tutorial walks you through creating a simple barcode scanner using your device's camera.

## Prerequisites {#prerequisites}

- A web browser that supports camera access (Chrome, Firefox, Safari, Edge)
- A device with a camera
- Basic knowledge of HTML and JavaScript

## Step 1: Set Up the HTML {#step-1-html}

Create an `index.html` file:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Barcode Scanner</title>
  <style>
    #scanner-container {
      position: relative;
      width: 100%;
      max-width: 640px;
    }
    #scanner-container video {
      width: 100%;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      background: #f0f0f0;
    }
  </style>
</head>
<body>
  <h1>Barcode Scanner</h1>
  <div id="scanner-container"></div>
  <div id="result">Scan a barcode...</div>
  
  <script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

## Step 2: Initialize Quagga {#step-2-initialize}

Create an `app.js` file:

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner-container'),
    constraints: {
      facingMode: "environment"  // Use back camera
    }
  },
  decoder: {
    readers: ["code_128_reader", "ean_reader", "upc_reader"]
  }
}, function(err) {
  if (err) {
    console.error("Failed to initialize:", err);
    document.querySelector('#result').textContent = "Error: " + err.message;
    return;
  }
  console.log("Scanner ready");
  Quagga.start();
});
```

## Step 3: Handle Detections {#step-3-handle-detections}

Add detection handling to `app.js`:

```javascript
Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  const format = result.codeResult.format;
  
  document.querySelector('#result').textContent = 
    `Found ${format}: ${code}`;
  
  console.log("Barcode detected:", code);
});
```

## Step 4: Run It {#step-4-run}

1. Serve the files using a local web server (required for camera access)
2. Open the page in your browser
3. Allow camera access when prompted
4. Point the camera at a barcode

**Note**: Camera access requires HTTPS on non-localhost domains.

## Complete Code {#complete-code}

Here's the complete `app.js`:

```javascript
Quagga.init({
  inputStream: {
    type: "LiveStream",
    target: document.querySelector('#scanner-container'),
    constraints: {
      facingMode: "environment"
    }
  },
  decoder: {
    readers: ["code_128_reader", "ean_reader", "upc_reader"]
  }
}, function(err) {
  if (err) {
    console.error("Failed to initialize:", err);
    document.querySelector('#result').textContent = "Error: " + err.message;
    return;
  }
  Quagga.start();
});

Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  const format = result.codeResult.format;
  document.querySelector('#result').textContent = `Found ${format}: ${code}`;
});
```

## Next Steps {#next-steps}

- [Static Image Scanning](static-image.md) - Decode images without camera
- [Configuration Reference](../reference/configuration.md) - Customize behavior
- [Tips and Tricks](../how-to-guides/tips-and-tricks.md) - Improve results

---

[← Back to Tutorials](index.md)
