# Working with Box Coordinates {#working-with-box-coordinates}

This guide explains how Quagga2's coordinate system works and how to properly use `box`, `boxes`, and `line` coordinates for overlay rendering, especially when using `inputStream.size` to scale processing.

## Understanding the Coordinate System {#understanding-coordinate-system}

Quagga2 returns `box`, `boxes`, and `line` coordinates in **processed canvas coordinates**, not original image/video coordinates. This is important to understand when:

- Drawing overlay boxes on a video element
- Using `inputStream.size` to reduce processing resolution
- Cropping detected barcode regions from the original image

### Key Concepts {#key-concepts}

| Term | Description |
|------|-------------|
| **Real Size** | The actual dimensions of the source image/video |
| **Processed Size** | The scaled dimensions used for barcode detection (controlled by `inputStream.size`) |
| **Canvas Size** | The dimensions of the processing canvas (typically matches processed size) |

### How Coordinates are Generated {#how-coordinates-generated}

1. **Image Scaling**: When `inputStream.size` is set, the image is scaled so the longest side equals that value
2. **Localization**: Barcode regions are found in the scaled image
3. **Box Coordinates**: Returned coordinates are relative to the scaled/processed image
4. **halfSample Adjustment**: If `halfSample: true`, coordinates are automatically scaled 2x

## Converting Coordinates to Original Image Space {#converting-coordinates}

When you need to draw boxes on the original video/image (not the processed canvas), you must scale the coordinates.

### For Live Video Streams {#live-video-streams}

```javascript
Quagga.onDetected(function(result) {
  if (!result.box) return;
  
  // Get the video element
  const video = document.querySelector('video');
  const videoWidth = video.videoWidth;   // Real video dimensions
  const videoHeight = video.videoHeight;
  
  // Get processed dimensions from Quagga
  const canvas = Quagga.canvas.dom.image;
  const processedWidth = canvas.width;
  const processedHeight = canvas.height;
  
  // Calculate scale factors
  const scaleX = videoWidth / processedWidth;
  const scaleY = videoHeight / processedHeight;
  
  // Convert box coordinates to video space
  const scaledBox = result.box.map(function(point) {
    return [
      point[0] * scaleX,
      point[1] * scaleY
    ];
  });
  
  // Now use scaledBox for drawing on video overlay
  drawBoxOnVideo(scaledBox);
});
```

### For Static Images with decodeSingle {#static-images-decodesingle}

```javascript
Quagga.decodeSingle({
  src: './barcode.jpg',
  inputStream: {
    size: 800  // Process at 800px max dimension
  },
  // ... other config
}, function(result) {
  if (!result || !result.box) return;
  
  // Load original image to get real dimensions
  const img = new Image();
  img.onload = function() {
    const realWidth = img.naturalWidth;
    const realHeight = img.naturalHeight;
    
    // Calculate what the processed size was
    const aspectRatio = realWidth / realHeight;
    let processedWidth, processedHeight;
    
    if (aspectRatio > 1) {
      // Landscape: width is the longest side
      processedWidth = 800;
      processedHeight = Math.floor(800 / aspectRatio);
    } else {
      // Portrait: height is the longest side
      processedHeight = 800;
      processedWidth = Math.floor(800 * aspectRatio);
    }
    
    // Calculate scale factors
    const scaleX = realWidth / processedWidth;
    const scaleY = realHeight / processedHeight;
    
    // Convert coordinates
    const scaledBox = result.box.map(function(point) {
      return [
        point[0] * scaleX,
        point[1] * scaleY
      ];
    });
    
    // Use scaledBox for original image operations
    cropBarcodeFromOriginal(scaledBox);
  };
  img.src = './barcode.jpg';
});
```

## Complete Example: Drawing Boxes on Live Video {#complete-example}

Here's a complete example showing how to draw accurate bounding boxes on a live video stream:

```javascript
// Initialize Quagga with reduced processing size for performance
Quagga.init({
  inputStream: {
    name: "Live",
    type: "LiveStream",
    target: document.querySelector('#scanner-container'),
    constraints: {
      width: 1280,
      height: 720,
      facingMode: "environment"
    },
    size: 640  // Process at 640px for better performance
  },
  locator: {
    patchSize: "medium",
    halfSample: true
  },
  decoder: {
    readers: ["code_128_reader", "ean_reader"]
  }
}, function(err) {
  if (err) {
    console.error(err);
    return;
  }
  Quagga.start();
});

// Handle detections with coordinate scaling
Quagga.onDetected(function(result) {
  const video = document.querySelector('video');
  const overlay = document.querySelector('#overlay-canvas');
  const ctx = overlay.getContext('2d');
  
  // Match overlay to video size
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
  
  // Get processed canvas size
  const processedCanvas = Quagga.canvas.dom.image;
  
  // Calculate scale factors
  const scaleX = video.videoWidth / processedCanvas.width;
  const scaleY = video.videoHeight / processedCanvas.height;
  
  // Clear previous drawings
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  
  // Draw all detected boxes
  if (result.boxes) {
    result.boxes.forEach(function(box) {
      drawScaledBox(ctx, box, scaleX, scaleY, '#00ff00');
    });
  }
  
  // Highlight the successfully decoded box
  if (result.box) {
    drawScaledBox(ctx, result.box, scaleX, scaleY, '#ff0000');
  }
});

function drawScaledBox(ctx, box, scaleX, scaleY, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Scale and draw each point
  const scaledPoints = box.map(p => [p[0] * scaleX, p[1] * scaleY]);
  
  ctx.moveTo(scaledPoints[0][0], scaledPoints[0][1]);
  for (let i = 1; i < scaledPoints.length; i++) {
    ctx.lineTo(scaledPoints[i][0], scaledPoints[i][1]);
  }
  ctx.closePath();
  ctx.stroke();
}
```

## When Coordinates Don't Need Scaling {#no-scaling-needed}

If you're drawing on Quagga's own overlay canvas (`Quagga.canvas.dom.overlay`), coordinates are already in the correct space:

```javascript
Quagga.onDetected(function(result) {
  const ctx = Quagga.canvas.ctx.overlay;
  const canvas = Quagga.canvas.dom.overlay;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // No scaling needed - coordinates match the overlay canvas
  if (result.box) {
    Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, ctx, {
      color: "#00ff00",
      lineWidth: 2
    });
  }
});
```

## Common Pitfalls {#common-pitfalls}

### 1. Forgetting halfSample Adjustment {#forgetting-halfsample}

If you're manually calculating processed size, remember that `halfSample: true` doesn't affect the returned coordinates (they're already adjusted).

### 2. Using Wrong Canvas Reference {#wrong-canvas-reference}

```javascript
// ❌ Wrong - using overlay canvas for scale calculation
const wrongWidth = Quagga.canvas.dom.overlay.width;

// ✅ Correct - using image canvas for scale calculation
const correctWidth = Quagga.canvas.dom.image.width;
```

### 3. Assuming Square Pixels {#assuming-square-pixels}

Always calculate scaleX and scaleY separately, as aspect ratios may differ:

```javascript
// ❌ Wrong - using single scale factor
const scale = videoWidth / canvasWidth;

// ✅ Correct - separate scale factors
const scaleX = videoWidth / canvasWidth;
const scaleY = videoHeight / canvasHeight;
```

## Performance Tips {#performance-tips}

1. **Use smaller `inputStream.size`** (e.g., 640-800) for live video to reduce CPU usage
2. **Cache scale factors** - recalculate only when video dimensions change
3. **Use requestAnimationFrame** for smooth overlay rendering
4. **Consider using Quagga's built-in overlay** when possible to avoid manual scaling
