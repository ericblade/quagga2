# Browser Support {#browser-support}

Quagga2 makes use of many modern Web APIs which are not implemented by all browsers yet. This page details browser compatibility and required APIs.

## Operating Modes {#operating-modes}

Quagga2 operates in two modes:

1. **Analyzing static images** - Process existing image files
2. **Using a camera** - Decode images from a live video stream

The latter requires the MediaDevices API for camera access.

## Browser Compatibility {#browser-compatibility}

You can track the compatibility of the used Web APIs for each mode:

- [Static Images](http://caniuse.com/#feat=canvas,typedarrays,bloburls,blobbuilder)
- [Live Stream](http://caniuse.com/#feat=canvas,typedarrays,bloburls,blobbuilder,stream)

### Static Image Mode {#static-image-mode}

The following APIs must be supported by your browser:

- [Canvas](http://caniuse.com/#feat=canvas)
- [Typed Arrays](http://caniuse.com/#feat=typedarrays)
- [Blob URLs](http://caniuse.com/#feat=bloburls)
- [Blob Builder](http://caniuse.com/#feat=blobbuilder)

### Live Stream Mode {#live-stream-mode}

In addition to the APIs required for static images:

- [MediaDevices API](http://caniuse.com/#feat=stream) - Required for camera access

## Secure Origins Required {#secure-origins}

**Important**: Accessing `getUserMedia` requires a secure origin in most browsers:

- `http://` can **only** be used on `localhost`
- All other hostnames **must** be served via `https://`

This is a browser security requirement. Read more in the [Chrome M47 WebRTC Release Notes](https://groups.google.com/forum/#!topic/discuss-webrtc/sq5CVmY69sc).

## Feature Detection {#feature-detection}

### Detecting getUserMedia Support {#detecting-getusermedia}

Every browser implements the `mediaDevices.getUserMedia` API differently. It's highly recommended to include [webrtc-adapter](https://github.com/webrtc/adapter) in your project for cross-browser compatibility.

**How to test browser capabilities:**

```javascript
if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  // Safe to use getUserMedia
  console.log('Camera access is supported');
} else {
  // Camera access not available
  console.log('Camera access is NOT supported');
}
```

### Browser Support Table {#browser-support-table}

The above condition evaluates as follows:

| Browser       | Result  | Notes |
|---------------|---------|-------|
| Chrome        | `true`  | Full support |
| Firefox       | `true`  | Full support |
| Edge          | `true`  | Full support |
| Safari iOS    | `true`  | Requires HTTPS |
| IE 11         | `false` | Not supported |
| Safari Desktop| `true`  | macOS 11+ |

## Known Issues {#known-issues}

### iOS Torch/Flash {#ios-torch-flash}

Torch (flash) control via `CameraAccess.enableTorch()` and `CameraAccess.disableTorch()` does **not work** on iOS devices running version 16.4 and earlier. Support on later versions may vary.

### Safari Limitations {#safari-limitations}

- Older Safari versions may require user interaction before camera access
- Some older iOS versions have limited WebRTC support

### Internet Explorer {#internet-explorer}

Internet Explorer 11 and below do not support the MediaDevices API and cannot use live camera features. Static image decoding may work with polyfills, but this is not officially supported.

## Recommendations {#recommendations}

For best compatibility:

1. **Use HTTPS** - Required for camera access on all non-localhost domains
2. **Include webrtc-adapter** - Normalizes browser differences
3. **Feature detect** - Check for API support before attempting to use camera
4. **Provide fallbacks** - Offer file upload as alternative to camera access
5. **Test thoroughly** - Browser behavior varies, especially on mobile

## Related {#related}

- [Configuration Reference](configuration.md) - How to configure Quagga2
- [Camera Access API](camera-access.md) - Camera control methods
- [Getting Started](../getting-started.md) - Installation and setup

---

[← Back to Reference](index.md)
