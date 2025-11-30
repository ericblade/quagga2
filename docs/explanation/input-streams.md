# How Input Streams Work {#how-input-streams-work}

This article explains the technical details of how Quagga2's input stream system works. Understanding this is helpful for troubleshooting initialization issues and understanding async behavior.

## Overview {#overview}

Quagga2 supports three types of input streams for reading barcode data:

| Type | Use Case | Input Source |
|------|----------|--------------|
| **LiveStream** | Real-time camera scanning | Device camera via getUserMedia |
| **VideoStream** | Pre-recorded video files | Video file via `<video>` element |
| **ImageStream** | Static images or image sequences | Image file(s) via URL |

All three stream types share the same interface (`InputStream`) and follow a common initialization pattern, but differ in how they acquire media.

## The InputStream Interface {#inputstream-interface}

Every input stream implements these core methods:

```typescript
interface InputStream {
    // Dimensions
    getWidth(): number;
    getHeight(): number;
    getRealWidth(): number;
    getRealHeight(): number;
    setWidth(width: number): void;
    setHeight(height: number): void;
    
    // Frame access
    getFrame(): HTMLVideoElement | HTMLImageElement | null;
    
    // Event handling
    addEventListener(event: string, handler: Function): void;
    clearEventHandlers(): void;
    trigger(eventName: string, args?: any): void;
    
    // Playback control
    play(): void;
    pause(): void;
    ended(): boolean;
    
    // Configuration
    setInputStream(config: any): void;
    getConfig(): any;
}
```

## Initialization Flow {#initialization-flow}

All stream types follow the same initialization sequence:

```
init() → initInputStream() → [async media access] → 'canrecord' event → canRecord() → framegrabber created
```

Here's what happens at each step:

### 1. `init()` is called {#step-1-init}

The static `Quagga.init(config, callback)` function starts the process:

```javascript
Quagga.init({
    inputStream: {
        type: 'LiveStream',  // or 'VideoStream' or 'ImageStream'
        target: document.querySelector('#scanner'),
        // ... other options
    },
    // ... decoder config
}, (err) => {
    if (err) {
        console.error('Init failed:', err);
        return;
    }
    Quagga.start();
});
```

### 2. `initInputStream()` creates the stream {#step-2-initinputstream}

Based on the `type` configuration, the appropriate stream factory is called:

- `LiveStream` → `createLiveStream(video)` 
- `VideoStream` → `createVideoStream(video)`
- `ImageStream` → `createImageStream()`

### 3. Async media access begins {#step-3-async-media}

This is where the streams diverge:

**LiveStream**: Calls `CameraAccess.request()` which uses `navigator.mediaDevices.getUserMedia()`. This is async because:
- Browser shows a permission prompt
- Camera hardware needs to spin up
- Video dimensions aren't known until stream starts

**VideoStream**: Creates a `<video>` element and waits for the video to load metadata. Async because the video file must be fetched.

**ImageStream**: Uses `ImageLoader` to fetch and decode image(s). Async because images must be downloaded.

### 4. `canrecord` event fires {#step-4-canrecord}

When the media is ready, the stream triggers the `canrecord` event. This is the signal that:
- Media dimensions are now available
- Frames can be grabbed
- Processing can begin

### 5. `canRecord()` completes initialization {#step-5-canrecord-callback}

The `canRecord()` callback:
1. Validates the input stream is properly initialized
2. Calls `checkImageConstraints()` to validate/adjust dimensions
3. Creates the canvas for drawing frames
4. Creates the **framegrabber** (the component that extracts frames)
5. Sets up worker threads (if configured)
6. Calls the user's callback to signal init is complete

### 6. Framegrabber indicates completion {#step-6-framegrabber}

The `framegrabber` being non-null is the reliable indicator that initialization completed successfully. This is why:

- The static `start()` function checks `if (!_context.framegrabber)` before proceeding
- The `stop()` function uses `!framegrabber` to detect if init was still in progress

## Stream Type Details {#stream-type-details}

### LiveStream {#livestream}

**Purpose**: Real-time barcode scanning using the device camera.

**How it works**:
1. Creates or finds a `<video>` element in the target container
2. Requests camera access via `getUserMedia()`
3. Attaches the camera stream to the video element
4. Sets `autoplay="true"` so the video starts immediately
5. Triggers `canrecord` when camera is ready

**Key characteristics**:
- `ended()` always returns `false` (camera never "ends")
- Requires HTTPS in production (browser security requirement)
- Can specify camera constraints (facing mode, resolution)

**Configuration example**:
```javascript
inputStream: {
    type: 'LiveStream',
    target: document.querySelector('#camera'),
    constraints: {
        facingMode: 'environment',  // Back camera
        width: { min: 640 },
        height: { min: 480 }
    }
}
```

### VideoStream {#videostream}

**Purpose**: Scanning barcodes from pre-recorded video files.

**How it works**:
1. Creates a new `<video>` element
2. Sets the `src` attribute to the video URL
3. Waits for video metadata to load
4. Triggers `canrecord` when dimensions are known

**Key characteristics**:
- `ended()` returns the video element's ended state
- Supports seeking via `setCurrentTime()`
- Video plays frame-by-frame during scanning

**Configuration example**:
```javascript
inputStream: {
    type: 'VideoStream',
    src: '/path/to/video.mp4'
}
```

### ImageStream {#imagestream}

**Purpose**: Scanning barcodes from static images or image sequences.

**How it works**:
1. Parses the image URL configuration
2. Uses `ImageLoader` to fetch the image(s)
3. Reads EXIF data to handle image orientation
4. Calculates dimensions based on size config
5. Triggers `canrecord` when image(s) are loaded

**Key characteristics**:
- Can process a single image or a sequence
- Handles EXIF orientation automatically
- `ended()` returns true after all images are processed
- Used internally by `decodeSingle()`

**Configuration example (single image)**:
```javascript
inputStream: {
    type: 'ImageStream',
    src: '/path/to/barcode.jpg',
    sequence: false
}
```

**Configuration example (image sequence)**:
```javascript
inputStream: {
    type: 'ImageStream',
    src: '/path/to/images/img_%d.jpg',  // %d is replaced with frame number
    sequence: true,
    length: 10  // Number of images
}
```

## Race Conditions and Async Behavior {#race-conditions}

Because initialization involves async operations (camera access, file loading), race conditions can occur if:

1. **`stop()` is called during `init()`**: The `canrecord` event may fire after `stop()` has begun cleanup. Quagga2 handles this with an `initAborted` flag.

2. **React StrictMode double-invocation**: StrictMode mounts, unmounts, and remounts components, causing rapid `init() → stop() → init()` sequences.

3. **Component unmounting before camera ready**: User navigates away before `getUserMedia()` resolves.

**Best practices to avoid issues**:

```javascript
useLayoutEffect(() => {
    let cancelled = false;
    
    Quagga.init(config, (err) => {
        if (cancelled) return;  // Ignore if unmounted
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });
    
    return () => {
        cancelled = true;
        Quagga.stop();
    };
}, []);
```

## Source Code {#source-code}

The input stream system is implemented in:

- `src/input/input_stream/input_stream_browser.ts` - Browser stream implementations
- `src/input/input_stream/input_stream.ts` - Node.js stream implementation
- `src/input/input_stream/input_stream.d.ts` - TypeScript interface
- `src/quagga/setupInputStream.ts` - Stream factory selection
- `src/input/camera_access.ts` - Camera permission handling
- `src/input/frame_grabber.js` - Frame extraction for Node.js (uses ndarray)
- `src/input/frame_grabber_browser.js` - Frame extraction for browsers (uses canvas)

> **Note**: Webpack replaces `frame_grabber.js` with `frame_grabber_browser.js` when building the browser bundle. The Node.js version uses `ndarray` for image manipulation, while the browser version uses the Canvas API.

## Related Reading {#related-reading}

- [How Barcode Localization Works](how-barcode-localization-works.md) - What happens after frames are grabbed
- [Camera Access Reference](../reference/camera-access.md) - Camera configuration options
- [Configuration Reference](../reference/configuration.md) - Full config documentation

---

[← Back to Explanation Index](index.md)
