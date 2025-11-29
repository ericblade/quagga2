# Tips and Tricks {#tips-and-tricks}

Practical advice for getting the best results with Quagga2.

## Camera Setup {#camera-setup}

### Choosing the Right Camera {#choosing-camera}

- Use the **back camera** on mobile devices (higher resolution, autofocus)
- Request environment-facing camera: `facingMode: "environment"`
- Avoid wide-angle cameras for barcode scanning

### Optimal Distance {#optimal-distance}

- Barcode should fill 50-80% of the frame width
- Too close: barcode may be out of focus
- Too far: insufficient resolution for small bars

## Lighting {#lighting}

- Ensure even lighting across the barcode
- Avoid harsh shadows or reflections
- Enable torch/flash for dark environments:

```javascript
await Quagga.CameraAccess.enableTorch();
```

## User Experience {#user-experience}

### Visual Feedback {#visual-feedback}

Show users the scan area:

```javascript
inputStream: {
  area: {
    top: "25%",
    right: "10%",
    bottom: "25%",
    left: "10%",
    borderColor: "rgba(0, 255, 0, 0.7)",
    borderWidth: 2
  }
}
```

### Audio Feedback {#audio-feedback}

Play a sound on successful scan:

```javascript
Quagga.onDetected(function(result) {
  new Audio('/beep.mp3').play();
  processBarcode(result.codeResult.code);
});
```

## Performance {#performance}

### Reduce CPU Usage {#reduce-cpu-usage}

```javascript
Quagga.init({
  frequency: 10,           // Limit to 10 scans/second
  inputStream: {
    size: 640              // Reduce processing resolution
  }
});
```

### Stop When Not Needed {#stop-when-not-needed}

```javascript
// Stop scanning when modal closes
Quagga.stop();

// Remove event handlers
Quagga.offDetected();
Quagga.offProcessed();
```

## Handling Results {#handling-results}

### Debounce Detections {#debounce-detections}

Avoid processing the same barcode multiple times:

```javascript
let lastScanned = '';
let lastTime = 0;

Quagga.onDetected(function(result) {
  const code = result.codeResult.code;
  const now = Date.now();
  
  if (code === lastScanned && now - lastTime < 2000) {
    return;  // Same barcode within 2 seconds
  }
  
  lastScanned = code;
  lastTime = now;
  processBarcode(code);
});
```

## Related {#related}

- [Optimize Performance](optimize-performance.md) - Detailed performance guide
- [Handle Difficult Barcodes](handle-difficult-barcodes.md) - Improve detection
- [Camera Access API](../reference/camera-access.md) - Camera control

---

[← Back to How-To Guides](index.md)
