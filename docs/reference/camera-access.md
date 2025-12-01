# CameraAccess API {#cameraaccess-api}

Quagga2 exposes a `CameraAccess` API for direct control of camera functionality. This API provides shortcuts for commonly used camera operations.

**Access**: `Quagga.CameraAccess`

## Overview {#overview}

The CameraAccess API allows you to:

- Request and release camera access
- Enumerate available video devices
- Control camera torch (flash)
- Get information about active video streams and tracks

All methods return Promises for async operation handling.

## Methods {#methods}

### `CameraAccess.request(videoElement, constraints)` {#cameraaccess-request}

Initializes the camera and starts playback.

**Parameters**:

- `videoElement` (HTMLVideoElement | null) - Video element to display camera stream. If `null`, camera initializes but remains invisible.
- `constraints` (MediaTrackConstraints, optional) - Camera selection and configuration constraints.

**Returns**: `Promise<void>` - Resolves when camera is ready, rejects on error.

**Example**:

```javascript
const video = document.querySelector('#camera-video');

// Request camera with default constraints
await Quagga.CameraAccess.request(video);

// Request specific camera
await Quagga.CameraAccess.request(video, {
  facingMode: 'environment',  // Back camera on mobile
  width: { ideal: 1280 },
  height: { ideal: 720 }
});

// Request camera by device ID
const deviceId = 'abc123...';
await Quagga.CameraAccess.request(video, { deviceId });

// Initialize camera without displaying (for probing)
await Quagga.CameraAccess.request(null);
```

**Use cases**:

- Start camera before Quagga initialization
- Probe camera availability and permissions
- Initialize camera without displaying video

### `CameraAccess.release()` {#cameraaccess-release}

Stops the video stream and releases all camera resources.

**Returns**: `Promise<void>` - Resolves when all tracks are stopped and resources released.

**Example**:

```javascript
// Stop camera
await Quagga.CameraAccess.release();
console.log('Camera released');
```

**Behavior**:

1. Pauses the video element
2. Stops all tracks in the media stream
3. Releases camera for use by other applications

**Note**: Always call `release()` when finished with the camera to free system resources.

### `CameraAccess.enumerateVideoDevices(constraints?)` {#cameraaccess-enumeratevideodevices}

Lists all available video input devices (cameras), optionally filtered by constraints.

**Parameters**:

- `constraints` (MediaTrackConstraints, optional) - Constraints to filter devices. When provided, only devices that can satisfy the given constraints will be returned.

**Returns**: `Promise<MediaDeviceInfo[]>` - Array of video device information.

**Example**:

```javascript
// Get all video devices
const devices = await Quagga.CameraAccess.enumerateVideoDevices();

devices.forEach(device => {
  console.log('Device:', device.label);
  console.log('Device ID:', device.deviceId);
  console.log('Group ID:', device.groupId);
});

// Example output:
// Device: Front Camera
// Device ID: abc123...
// Device: Back Camera
// Device ID: def456...
```

**Filtering devices with constraints**:

```javascript
// Get only devices that support a minimum resolution
const hdDevices = await Quagga.CameraAccess.enumerateVideoDevices({
  width: { min: 1280 },
  height: { min: 720 }
});

// Get only back-facing cameras
const backCameras = await Quagga.CameraAccess.enumerateVideoDevices({
  facingMode: 'environment'
});

// Eliminate wide-angle only cameras by specifying aspect ratio
const standardCameras = await Quagga.CameraAccess.enumerateVideoDevices({
  aspectRatio: { ideal: 1.777 }  // 16:9
});
```

**Use cases**:

- Build camera selector UI
- Detect available cameras before initialization
- Check for front/back camera availability on mobile
- Filter out cameras that don't meet quality requirements
- Eliminate wide-angle cameras that may not be suitable for barcode scanning

**Note**: Device labels may be empty strings until camera permission is granted. When using constraints, the method will request temporary access to each device to test if it satisfies the constraints.

### `CameraAccess.getActiveStreamLabel()` {#cameraaccess-getactivestreamlabel}

Gets the label of the currently active video track.

**Returns**: `string` - Label of active video track (e.g., "Back Camera", "USB Camera").

**Example**:

```javascript
const label = Quagga.CameraAccess.getActiveStreamLabel();
console.log('Using camera:', label);
// Output: "Using camera: Back Camera"
```

**Use cases**:

- Display which camera is currently active
- Verify correct camera is being used
- Logging and debugging

### `CameraAccess.getActiveStream()` {#cameraaccess-getactivestream}

Gets the complete MediaStream object for the currently active video.

**Returns**: `MediaStream | null` - The active MediaStream object, or `null` if no camera is active.

**Example**:

```javascript
const stream = Quagga.CameraAccess.getActiveStream();

if (stream) {
  console.log('Stream ID:', stream.id);
  console.log('Stream active:', stream.active);
  console.log('Video tracks:', stream.getVideoTracks().length);
  console.log('Audio tracks:', stream.getAudioTracks().length);

  // Clone the stream
  const clonedStream = stream.clone();
}

// Pass stream to WebRTC peer connection
if (stream?.active) {
  peerConnection.addStream(stream);
}
```

**Use cases**:

- Pass the stream to WebRTC peer connections
- Clone the stream for multiple consumers
- Check if the stream is still active via `stream.active`
- Access the stream ID
- Work with all tracks (video and audio) in the stream

**Note**: For accessing just the video track, use `getActiveTrack()` instead.

### `CameraAccess.getActiveTrack()` {#cameraaccess-getactivetrack}

Gets the MediaStreamTrack for the currently active video.

**Returns**: `MediaStreamTrack | null` - Active video track object, or `null` if no camera is active.

**Example**:

```javascript
const track = Quagga.CameraAccess.getActiveTrack();

console.log('Track state:', track.readyState);
console.log('Track settings:', track.getSettings());
console.log('Track capabilities:', track.getCapabilities());

// Get current resolution
const settings = track.getSettings();
console.log(`Resolution: ${settings.width}x${settings.height}`);
```

**Use cases**:

- Access advanced track capabilities
- Monitor track state
- Apply additional constraints
- Access camera capabilities (zoom, focus, etc.)

### `CameraAccess.enableTorch()` {#cameraaccess-enabletorch}

Turns on the camera torch (flash).

**Returns**: `Promise<void>` - Resolves when torch is enabled, rejects on error.

**Example**:

```javascript
try {
  await Quagga.CameraAccess.enableTorch();
  console.log('Torch enabled');
} catch (error) {
  console.error('Failed to enable torch:', error);
}
```

**Browser Support**:

- ✅ Chrome (Android)
- ✅ Chrome (Desktop with supported cameras)
- ❌ Safari iOS 16.4 and earlier
- ⚠️ Safari iOS later versions - may or may not work

**Requirements**:

- Camera must support torch capability
- Camera must be actively streaming
- Browser must support torch constraint

**Note**: Always wrap in try-catch as not all devices support torch.

### `CameraAccess.disableTorch()` {#cameraaccess-disabletorch}

Turns off the camera torch (flash).

**Returns**: `Promise<void>` - Resolves when torch is disabled, rejects on error.

**Example**:

```javascript
try {
  await Quagga.CameraAccess.disableTorch();
  console.log('Torch disabled');
} catch (error) {
  console.error('Failed to disable torch:', error);
}
```

**Browser Support**: Same as `enableTorch()`.

## Complete Example {#complete-example}

```javascript
// Enumerate cameras and let user choose
const devices = await Quagga.CameraAccess.enumerateVideoDevices();
const backCamera = devices.find(d => d.label.includes('back'));

// Initialize camera
const video = document.querySelector('#video');
await Quagga.CameraAccess.request(video, {
  deviceId: backCamera.deviceId
});

console.log('Active camera:', Quagga.CameraAccess.getActiveStreamLabel());

// Enable torch for better scanning in dark environments
try {
  await Quagga.CameraAccess.enableTorch();
} catch (error) {
  console.log('Torch not available');
}

// ... use camera for scanning ...

// Cleanup
await Quagga.CameraAccess.disableTorch();
await Quagga.CameraAccess.release();
```

## Torch Control in Live Scanning {#torch-control}

For torch control during live scanning, you may want to provide a toggle button:

```javascript
let torchEnabled = false;

document.querySelector('#torch-toggle').addEventListener('click', async () => {
  try {
    if (torchEnabled) {
      await Quagga.CameraAccess.disableTorch();
      torchEnabled = false;
    } else {
      await Quagga.CameraAccess.enableTorch();
      torchEnabled = true;
    }
  } catch (error) {
    console.error('Torch control failed:', error);
    alert('Torch not available on this device');
  }
});
```

## Advanced Camera Control {#advanced-camera-control}

For advanced camera control (zoom, focus, etc.), use the MediaStreamTrack API:

```javascript
const track = Quagga.CameraAccess.getActiveTrack();
const capabilities = track.getCapabilities();

// Check if zoom is supported
if (capabilities.zoom) {
  console.log('Zoom range:', capabilities.zoom.min, '-', capabilities.zoom.max);

  // Apply zoom
  await track.applyConstraints({
    advanced: [{ zoom: 2.0 }]
  });
}
```

Read more: [MediaStreamTrack Capabilities](https://www.oberhofer.co/mediastreamtrack-and-its-capabilities)

## Error Handling {#error-handling}

Always handle errors when using CameraAccess methods:

```javascript
try {
  await Quagga.CameraAccess.request(video);
} catch (error) {
  if (error.name === 'NotAllowedError') {
    console.error('Camera permission denied');
  } else if (error.name === 'NotFoundError') {
    console.error('No camera found');
  } else {
    console.error('Camera error:', error);
  }
}
```

## Related {#related}

- [Browser Support](browser-support.md) - Camera compatibility information
- [Configuration Reference](configuration.md) - Camera configuration in Quagga.init()
- [API Documentation](api.md) - Main Quagga API methods
- [Tips & Tricks](../how-to-guides/tips-and-tricks.md) - Camera optimization tips

---

[← Back to Reference](index.md)
