# quagga2

[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/ericblade/quagga2)

[![Join the chat at https://gitter.im/quaggaJS/Lobby](https://badges.gitter.im/quaggaJS/Lobby.svg)](https://gitter.im/quaggaJS/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Rate on Openbase](https://badges.openbase.io/js/rating/@ericblade/quagga2.svg)](https://openbase.io/js/@ericblade/quagga2?utm_source=embedded&utm_medium=badge&utm_campaign=rate-badge)

This is a fork of the original QuaggaJS library, that will be maintained until such time as the
original author and maintainer returns, or it has been completely replaced by built-in browser and
node functionality.

## 📚 Documentation

**[Complete Documentation](https://ericblade.github.io/quagga2/)** - Tutorials, guides, API reference, and more
(UNDER CONSTRUCTION!!!)

Quick links from this README:

- [Changelog](https://github.com/ericblade/quagga2/releases)
- [Browser Support](#browser-support)
- [Installing](#installing)
- [Getting Started](#gettingstarted)
- [Using with React](#usingwithreact)
- [Using External Readers](#usingwithexternalreaders)
- [API](#api)
- [CameraAccess API](#cameraaccess-api)
- [Configuration](#configobject)
- [Tips & Tricks](#tipsandtricks)

## Using React / Redux?

Please see also <https://github.com/ericblade/quagga2-react-example/> and <https://github.com/ericblade/quagga2-redux-middleware/>. For live browser examples, see [docs/examples/](docs/examples/).

## Using Angular?

Please see <https://github.com/julienboulay/ngx-barcode-scanner> or <https://github.com/classycodeoss/mobile-scanning-demo>

## Using ThingWorx?

Please see <https://github.com/ptc-iot-sharing/ThingworxBarcodeScannerWidget>

## Using Vue?

- **Vue 2**: <https://github.com/DevinNorgarb/vue-quagga-2>
- **Vue 3**: <https://github.com/nick-0101/vue3-quagga-2>

## What is QuaggaJS?

QuaggaJS is a barcode-scanner entirely written in JavaScript supporting real-time localization and decoding of various types of barcodes such as __EAN__,
__CODE 128__, __CODE 39__, __EAN 8__, __UPC-A__, __UPC-C__, __I2of5__,
__2of5__, __CODE 93__, __CODE 32__, __CODABAR__, and __PHARMACODE__. The library is also capable of using
`getUserMedia` to get direct access to the user's camera stream. Although the
code relies on heavy image-processing even recent smartphones are capable of
locating and decoding barcodes in real-time.

Try some [examples](https://ericblade.github.io/quagga2/examples) and check out
the blog post ([How barcode-localization works in QuaggaJS][oberhofer_co_how])
if you want to dive deeper into this topic.

![teaser][teaser_left]![teaser][teaser_right]

## Yet another barcode library?

This is not yet another port of the great [zxing][zxing_github] library, but
more of an extension to it. This implementation features a barcode locator which
is capable of finding a barcode-like pattern in an image resulting in an
estimated bounding box including the rotation. Simply speaking, this reader is
invariant to scale and rotation, whereas other libraries require the barcode to
be aligned with the viewport.

## <a name="browser-support">Browser Support</a>

Quagga makes use of many modern Web-APIs which are not implemented by all
browsers yet. There are two modes in which Quagga operates:

1. analyzing static images and
2. using a camera to decode the images from a live-stream.

The latter requires the presence of the MediaDevices API. You can track the compatibility
of the used Web-APIs for each mode:

- [Static Images](http://caniuse.com/#feat=webworkers,canvas,typedarrays,bloburls,blobbuilder)
- [Live Stream](http://caniuse.com/#feat=webworkers,canvas,typedarrays,bloburls,blobbuilder,stream)

### Static Images

The following APIs need to be implemented in your browser:

- [canvas](http://caniuse.com/#feat=canvas)
- [typedarrays](http://caniuse.com/#feat=typedarrays)
- [bloburls](http://caniuse.com/#feat=bloburls)
- [blobbuilder](http://caniuse.com/#feat=blobbuilder)

### Live Stream

In addition to the APIs mentioned above:

- [MediaDevices](http://caniuse.com/#feat=stream)

__Important:__ Accessing `getUserMedia` requires a secure origin in most
browsers, meaning that `http://` can only be used on `localhost`. All other
hostnames need to be served via `https://`. You can find more information in the
[Chrome M47 WebRTC Release Notes](https://groups.google.com/forum/#!topic/discuss-webrtc/sq5CVmY69sc).

### Feature-detection of getUserMedia

Every browser seems to differently implement the `mediaDevices.getUserMedia`
API. Therefore it's highly recommended to include
[webrtc-adapter](https://github.com/webrtc/adapter) in your project.

Here's how you can test your browser's capabilities:

```javascript
if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  // safely access `navigator.mediaDevices.getUserMedia`
}
```

The above condition evaluates to:

| Browser       | result  |
| ------------- |:-------:|
| Edge          | `true`  |
| Chrome        | `true`  |
| Firefox       | `true`  |
| IE 11         | `false` |
| Safari iOS    | `true` |

## <a name="installing">Installing</a>

Quagga2 can be installed using __npm__, or by including it with the __script__ tag.

### NPM

```console
> npm install --save @ericblade/quagga2
```

And then import it as dependency in your project:

```javascript
import Quagga from '@ericblade/quagga2'; // ES6
const Quagga = require('@ericblade/quagga2').default; // Common JS (important: default)
```

Currently, the full functionality is only available through the browser. When
using QuaggaJS within __node__, only file-based decoding is available. See the
example for [node_examples](#node-example).

### Using with script tag

You can simply include `quagga.js` in your project and you are ready
to go. The script exposes the library on the global namespace under `Quagga`.

```html
<script src="quagga.js"></script>
```

You can get the `quagga.js` file in the following ways:

By [installing the npm module](https://github.com/ericblade/quagga2#npm) and copying the `quagga.js` file from the `dist` folder.

(OR)

You can also build the library yourself and copy `quagga.js` file from the `dist` folder(refer to the [building](https://github.com/ericblade/quagga2#building) section for more details)

(OR)

You can include the following script tags with  CDN links:

a) `quagga.js`

```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.js"></script>
```

b) `quagga.min.js` (minified version)

```html
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js"></script>
```

*Note: You can include a specific version of the library by including the version as shown below.*

```html
<!-- Link for Version 1.2.6 -->
<script src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.2.6/dist/quagga.js"></script>
```

## <a name="gettingstarted">Getting Started</a>

For starters, have a look at the [examples][github_examples] to get an idea
where to go from here.

## <a name="usingwithreact">Using with React</a>

There is a separate [example][reactExample] for using quagga2 with ReactJS

## <a name="usingwithexternalreaders">Using with External Readers</a>

New in Quagga2 is the ability to specify external reader modules. Please see [quagga2-reader-qr](https://github.com/ericblade/quagga2-reader-qr). This repository includes a sample external reader that can
read complete images, and decode QR codes.  A test script is included to demonstrate how to use an
external reader in your project.

Quagga2 exports the BarcodeReader prototype, which should also allow you to create new barcode
reader implementations using the base BarcodeReader implementation inside Quagga2.  The QR reader
does not make use of this functionality, as QR is not picked up as a barcode in BarcodeReader.

### External Reader Priority

External readers follow the same priority rules as built-in readers. Once registered with
`Quagga.registerReader()`, an external reader can be placed anywhere in the `readers` array,
and its position determines when it attempts to decode relative to other readers.

```javascript
// Register external reader first
Quagga.registerReader('my_custom_reader', MyCustomReader);

// Use in config - position determines priority
Quagga.init({
    decoder: {
        // External reader tried first, then built-in readers
        readers: ['my_custom_reader', 'ean_reader', 'code_128_reader']
    }
});
```

## <a name="Building">Building</a>

You can build the library yourself by simply cloning the repo and typing:

```console
> npm install
> npm run build
```

or using Docker:

```console
> docker build --tag quagga2/build .
> docker run -v $(pwd):/quagga2 quagga2/build npm install
> docker run -v $(pwd):/quagga2 quagga2/build npm run build
```

it's also possible to use docker-compose:

```console
> docker-compose run nodejs npm install
> docker-compose run nodejs npm run build
```

*Note: when using Docker or docker-compose the build artifacts will end up in `dist/` as usual thanks to the bind-mount.*

This npm script builds a non optimized version `quagga.js` and a minified
version `quagga.min.js` and places both files in the `dist` folder.
Additionally, a `quagga.map` source-map is placed alongside these files. This
file is only valid for the non-uglified version `quagga.js` because the
minified version is altered after compression and does not align with the map
file any more.

## <a name="WorkingWithDev">Working with a development version from another project</a>

If you are working on a project that includes quagga, but you need to use a development version of
quagga, then you can run from the quagga directory:

```bash
npm install && npm run build && npm link
```

then from the other project directory that needs this quagga, do

```bash
npm link @ericblade/quagga2
```

When linking is successful, all future runs of 'npm run build' will update the version that is
linked in the project.  When combined with an application using webpack-dev-server or some other
hot-reload system, you can do very rapid iteration this way.

### Node

The code in the `dist` folder is only targeted to the browser and won't work in
node due to the dependency on the DOM. For the use in node, the `build` command
also creates a `quagga.js` file in the `lib` folder.

## <a name="api">API</a>

You can check out the [examples][github_examples] to get an idea of how to
use QuaggaJS. Basically the library exposes the following API:

### <a name="quaggainit">Quagga.init(config, callback)</a>

This method initializes the library for a given configuration `config` (see
below) and invokes the `callback(err)` when Quagga has finished its
bootstrapping phase. The initialization process also requests for camera
access if real-time detection is configured. In case of an error, the `err`
parameter is set and contains information about the cause. A potential cause
may be the `inputStream.type` is set to `LiveStream`, but the browser does
not support this API, or simply if the user denies the permission to use the
camera.

If you do not specify a target, QuaggaJS would look for an element that matches
the CSS selector `#interactive.viewport` (for backwards compatibility).
`target` can be a string (CSS selector matching one of your DOM node) or a DOM
node.

```javascript
Quagga.init({
    inputStream : {
      name : "Live",
      type : "LiveStream",
      target: document.querySelector('#yourElement')    // Or '#yourElement' (optional)
    },
    decoder : {
      readers : ["code_128_reader"]
    }
  }, function(err) {
      if (err) {
          console.log(err);
          return
      }
      console.log("Initialization finished. Ready to start");
      Quagga.start();
  });
```

### Quagga.start()

When the library is initialized, the `start()` method starts the video-stream
and begins locating and decoding the images.

### Quagga.stop()

If the decoder is currently running, after calling `stop()` the decoder does not
process any more images. Additionally, if a camera-stream was requested upon
initialization, this operation also disconnects the camera.

### Quagga.onProcessed(callback)

This method registers a `callback(data)` function that is called for each frame
after the processing is done. The `data` object contains detailed information
about the success/failure of the operation. The output varies, depending whether
the detection and/or decoding were successful or not.

### Quagga.onDetected(callback)

Registers a `callback(data)` function which is triggered whenever a barcode-
pattern has been located and decoded successfully. The passed `data` object
contains information about the decoding process including the detected code
which can be obtained by calling `data.codeResult.code`.

### Quagga.decodeSingle(config, callback)

In contrast to the calls described above, this method does not rely on
`getUserMedia` and operates on a single image instead. The provided callback
is the same as in `onDetected` and contains the result `data` object.

**Important**: `decodeSingle` has a built-in default of `inputStream.size: 800`.
This means images are automatically scaled to 800px on their longest side (both
larger images scaled down AND smaller images scaled up). The `box`, `boxes`, and
`line` coordinates in the result are returned in this scaled coordinate space,
not the original image dimensions. To disable scaling and use original dimensions,
set `inputStream.size` to `0`.

### Quagga.offProcessed(handler)

In case the `onProcessed` event is no longer relevant, `offProcessed` removes
the given `handler` from the event-queue. When no handler is passed, all handlers are removed.

### Quagga.offDetected(handler)

In case the `onDetected` event is no longer relevant, `offDetected` removes
the given `handler` from the event-queue. When no handler is passed, all handlers are removed.

## <a name="resultobject">The result object</a>

The callbacks passed into `onProcessed`, `onDetected` and `decodeSingle`
receive a `data` object upon execution. The `data` object contains the following
information. Depending on the success, some fields may be `undefined` or just
empty.

```javascript
{
  "codeResult": {
    "code": "FANAVF1461710",  // the decoded code as a string
    "format": "code_128", // or code_39, codabar, ean_13, ean_8, upc_a, upc_e
    "start": 355,
    "end": 26,
    "codeset": 100,
    "startInfo": {
      "error": 1.0000000000000002,
      "code": 104,
      "start": 21,
      "end": 41
    },
    "decodedCodes": [{
      "code": 104,
      "start": 21,
      "end": 41
    },
    // stripped for brevity
    {
      "error": 0.8888888888888893,
      "code": 106,
      "start": 328,
      "end": 350
    }],
    "endInfo": {
      "error": 0.8888888888888893,
      "code": 106,
      "start": 328,
      "end": 350
    },
    "direction": -1
  },
  "line": [{
    "x": 25.97278706156836,
    "y": 360.5616435369468
  }, {
    "x": 401.9220519377024,
    "y": 70.87524989906444
  }],
  "angle": -0.6565217179979483,
  "pattern": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, /* ... */ 1],
  "box": [
    [77.4074243622672, 410.9288668804402],
    [0.050203235235130705, 310.53619724086366],
    [360.15706727788256, 33.05711026051813],
    [437.5142884049146, 133.44977990009465]
  ],
  "boxes": [
    [
      [77.4074243622672, 410.9288668804402],
      [0.050203235235130705, 310.53619724086366],
      [360.15706727788256, 33.05711026051813],
      [437.5142884049146, 133.44977990009465]
    ],
    [
      [248.90769330706507, 415.2041489551161],
      [198.9532321622869, 352.62160512937635],
      [339.546160777576, 240.3979259789976],
      [389.5006219223542, 302.98046980473737]
    ]
  ]
}
```

## <a name="cameraaccess-api">CameraAccess API</a>

Quagga2 exposes a CameraAccess API that is available for performing some shortcut access to commonly
used camera functions.  This API is available as `Quagga.CameraAccess` and is documented below.

**[Full CameraAccess API Documentation](https://ericblade.github.io/quagga2/reference/camera-access.html)** - Detailed reference with examples, error handling, and advanced usage.

## CameraAccess.request(HTMLVideoElement | null, MediaTrackConstraints?)

Will attempt to initialize the camera and start playback given the specified video element.  Camera
is selected by the browser based on the MediaTrackConstraints supplied.  If no video element is
supplied, the camera will be initialized but invisible.  This is mostly useful for probing that the
camera is available, or probing to make sure that permissions are granted by the user.
This function will return a Promise that resolves when completed, or rejects on error.

## CameraAccess.release()

If a video element is known to be running, this will pause the video element, then return a Promise
that when resolved will have stopped all tracks in the video element, and released all resources.

## CameraAccess.enumerateVideoDevices(constraints?)

This will send out a call to navigator.mediaDevices.enumerateDevices(), filter out any mediadevices
that do not have a kind of 'videoinput', and resolve the promise with an array of MediaDeviceInfo.

Optionally, you can pass MediaTrackConstraints to filter devices. When constraints are provided,
only devices that can satisfy the given constraints will be returned. This is useful for filtering
out cameras that don't meet your requirements (e.g., eliminating wide-angle cameras).

```javascript
// Get all video devices
const devices = await Quagga.CameraAccess.enumerateVideoDevices();

// Get only devices that support minimum resolution
const hdDevices = await Quagga.CameraAccess.enumerateVideoDevices({
  width: { min: 1280 },
  height: { min: 720 }
});

// Get only back-facing cameras
const backCameras = await Quagga.CameraAccess.enumerateVideoDevices({
  facingMode: 'environment'
});
```

## CameraAccess.getActiveStreamLabel()

Returns the label for the active video track

## CameraAccess.getActiveTrack()

Returns the MediaStreamTrack for the active video track

## CameraAccess.disableTorch()

Turns off Torch. (Camera Flash)  Resolves when complete, throws on error.  Does not work on iOS devices of at least version 16.4 and earlier.  May or may not work on later versions.

## CameraAccess.enableTorch()

Turns on Torch. (Camera Flash)  Resolves when complete, throws on error.  Does not work on iOS devices of at least version 16.4 and earlier.  May or may not work on later versions.

## <a name="configobject">Configuration</a>

The configuration that ships with QuaggaJS covers the default use-cases and can
be fine-tuned for specific requirements.

The configuration is managed by the `config` object defining the following
high-level properties:

```javascript
{
  locate: true,
  inputStream: {...},
  frequency: 10,
  decoder:{...},
  locator: {...},
  debug: false,
}
```

### locate

One of the main features of QuaggaJS is its ability to locate a barcode in a
given image. The `locate` property controls whether this feature is turned on
(default) or off.

Why would someone turn this feature off? Localizing a barcode is a
computationally expensive operation and might not work properly on some
devices. Another reason would be the lack of auto-focus producing blurry
images which makes the localization feature very unstable.

However, even if none of the above apply, there is one more case where it might
be useful to disable `locate`: If the orientation, and/or the approximate
position of the barcode is known, or if you want to guide the user through a
rectangular outline. This can increase performance and robustness at the same
time.

### inputStream

The `inputStream` property defines the sources of images/videos within QuaggaJS.

```javascript
{
  name: "Live",
  type: "LiveStream",
  constraints: {
    width: 640,
    height: 480,
    facingMode: "environment",
    deviceId: "7832475934759384534"
  },
  area: { // defines rectangle of the detection/localization area
    top: "0%",    // top offset
    right: "0%",  // right offset
    left: "0%",   // left offset
    bottom: "0%"  // bottom offset
  },
  singleChannel: false, // true: only the red color-channel is read
  debug: {
    showImageDetails: false // logs frame grabber info and canvas size adjustments to console
  }
}
```

First, the `type` property can be set to three different values:
`ImageStream`, `VideoStream`, or `LiveStream` (default) and should be selected
depending on the use-case. Most probably, the default value is sufficient.

Second, the `constraint` key defines the physical dimensions of the input image
and additional properties, such as `facingMode` which sets the source of the
user's camera in case of multiple attached devices. Additionally, if required,
the `deviceId` can be set if the selection of the camera is given to the user.
This can be easily achieved via
[MediaDevices.enumerateDevices()][enumerateDevices]

Thirdly, the `area` prop restricts the decoding area of the image. The values
are given in percentage, similar to the CSS style property when using
`position: absolute`. This `area` is also useful in cases the `locate` property
is set to `false`, defining the rectangle for the user.

The last key `singleChannel` is only relevant in cases someone wants to debug
erroneous behavior of the decoder. If set to `true` the input image's red
color-channel is read instead of calculating the gray-scale values of the
source's RGB. This is useful in combination with the `ResultCollector` where
the gray-scale representations of the wrongly identified images are saved.

### frequency

This top-level property controls the scan-frequency of the video-stream. It's
optional and defines the maximum number of scans per second. This renders
useful for cases where the scan-session is long-running and resources such as
CPU power are of concern.

Note: `frequency` specifies a maximum, not an absolute rate. If the system
cannot achieve the requested frequency due to CPU limitations, decoding
complexity, or other factors, scans will occur as fast as the system allows.
For example, if you set `frequency: 10` but your system can only process 8
scans per second, you will get approximately 8 scans per second.

### decoder

QuaggaJS usually runs in a two-stage manner (`locate` is set to `true`) where,
after the barcode is located, the decoding process starts. Decoding is the
process of converting the bars into their true meaning. Most of the configuration
options within the `decoder` are for debugging/visualization purposes only.

```javascript
{
  readers: [
    'code_128_reader'
  ],
  debug: {
      drawBoundingBox: false,
      showFrequency: false,
      drawScanline: false,
      showPattern: false,
      printReaderInfo: false // logs reader registration and initialization to console
  }
  multiple: false
}
```

The most important property is `readers` which takes an array of types of
barcodes which should be decoded during the session. Possible values are:

- code_128_reader (default)
- ean_reader
- ean_8_reader
- code_39_reader
- code_39_vin_reader
- codabar_reader
- upc_reader
- upc_e_reader
- i2of5_reader
- 2of5_reader
- code_93_reader
- code_32_reader
- pharmacode_reader

Why are not all types activated by default? Simply because one should
explicitly define the set of barcodes for their use-case. More decoders means
more possible clashes, or false-positives. One should take care of the order
the readers are given, since some might return a value even though it is not
the correct type (EAN-13 vs. UPC-A).

#### Reader Priority and Order

**Readers are processed in the exact order they appear in the `readers` array.**
The first reader to successfully decode the barcode wins. This allows you to
prioritize certain formats over others when multiple formats might match the
same barcode pattern.

For example, if you know most of your barcodes are EAN-13, place `ean_reader`
first to ensure it attempts to decode before other readers:

```javascript
decoder: {
    readers: ['ean_reader', 'upc_reader', 'upc_e_reader']  // EAN-13 checked first
}
```

This is particularly important when dealing with barcode formats that share
similar patterns (like EAN-13 and UPC-A/UPC-E), where incorrect matches might
occur if the wrong reader attempts to decode first.

The `multiple` property tells the decoder if it should continue decoding after
finding a valid barcode.  If multiple is set to `true`, the results will be
returned as an array of result objects.  Each object in the array will have a
`box`, and may have a `codeResult` depending on the success of decoding the
individual box.

The remaining properties `drawBoundingBox`, `showFrequency`, `drawScanline` and
`showPattern` are mostly of interest during debugging and visualization.

#### <a name="ean_extended">Enabling extended EAN</a>

The default setting for `ean_reader` is not capable of reading extensions such
as [EAN-2](https://en.wikipedia.org/wiki/EAN_2) or
[EAN-5](https://en.wikipedia.org/wiki/EAN_5). In order to activate those
supplements you have to provide them in the configuration as followed:

```javascript
decoder: {
    readers: [{
        format: "ean_reader",
        config: {
            supplements: [
                'ean_5_reader', 'ean_2_reader'
            ]
        }
    }]
}
```

Beware that the order of the `supplements` matters in such that the reader stops
decoding when the first supplement was found. So if you are interested in EAN-2
and EAN-5 extensions, use the order depicted above.

It's important to mention that, if supplements are supplied, regular EAN-13
codes cannot be read any more with the same reader. If you want to read EAN-13
with and without extensions you have to add another `ean_reader` reader to the
configuration.

### locator

The `locator` config is only relevant if the `locate` flag is set to `true`.
It controls the behavior of the localization-process and needs to be adjusted
for each specific use-case. The default settings are simply a combination of
values which worked best during development.

Only two properties are relevant for the use in Quagga (`halfSample` and
`patchSize`) whereas the rest is only needed for development and debugging.

```javascript
{
  halfSample: true,
  patchSize: "medium", // x-small, small, medium, large, x-large
  debug: {
    showCanvas: false,
    showPatches: false,
    showFoundPatches: false,
    showSkeleton: false,
    showLabels: false,
    showPatchLabels: false,
    showRemainingPatchLabels: false,
    showPatchSize: false, // logs calculated patch size to console
    showImageDetails: false, // logs image wrapper size and canvas details to console
    boxFromPatches: {
      showTransformed: false,
      showTransformedBox: false,
      showBB: false
    }
  }
}
```

The `halfSample` flag tells the locator-process whether it should operate on an
image scaled down (half width/height, quarter pixel-count ) or not. Turning
`halfSample` on reduces the processing-time significantly and also helps
finding a barcode pattern due to implicit smoothing.
It should be turned off in cases where the barcode is really small and the full
resolution is needed to find the position. It's recommended to keep it turned
on and use a higher resolution video-image if needed.

The second property `patchSize` defines the density of the search-grid. The
property accepts strings of the value `x-small`, `small`, `medium`, `large` and
`x-large`. The `patchSize` is proportional to the size of the scanned barcodes.
If you have really large barcodes which can be read close-up, then the use of
`large` or `x-large` is recommended. In cases where the barcode is further away
from the camera lens (lack of auto-focus, or small barcodes) then it's advised
to set the size to `small` or even `x-small`. For the latter it's also
recommended to crank up the resolution in order to find a barcode.

## Examples

The following example takes an image `src` as input and prints the result on the
console. The decoder is configured to detect *Code128* barcodes and enables the
locating-mechanism for more robust results.

```javascript
Quagga.decodeSingle({
    decoder: {
        readers: ["code_128_reader"] // List of active readers
    },
    locate: true, // try to locate the barcode in the image
    src: '/test/fixtures/code_128/image-001.jpg' // or 'data:image/jpg;base64,' + data
    // Note: inputStream.size defaults to 800; images are scaled to 800px (up or down).
}, function(result){
    if(result.codeResult) {
        console.log("result", result.codeResult.code);
    } else {
        console.log("not detected");
    }
});
```

### <a name="node-example">Using node</a>

The following example illustrates the use of QuaggaJS within a node
environment. It's almost identical to the browser version with the difference
that node does not support web-workers out of the box. Therefore the config
property `numOfWorkers` must be explicitly set to `0`.

```javascript
var Quagga = require('quagga').default;

Quagga.decodeSingle({
    src: "image-abc-123.jpg",
    numOfWorkers: 0,  // Needs to be 0 when used within node
    inputStream: {
        size: 800  // This is the default; shown explicitly for clarity
    },
    decoder: {
        readers: ["code_128_reader"] // List of active readers
    },
}, function(result) {
    if(result.codeResult) {
        console.log("result", result.codeResult.code);
    } else {
        console.log("not detected");
    }
});
```

## <a name="tipsandtricks">Tips & Tricks</a>

A growing collection of tips & tricks to improve the various aspects of Quagga.

### Working with Cordova / PhoneGap?

If you're having issues getting a mobile device to run Quagga using Cordova, you might try the code
here: [Original Repo Issue #94 Comment][issue-94-comment]

```javascript
let permissions = cordova.plugins.permissions; permissions.checkPermission(permissions.CAMERA,
(res) => { if (!res.hasPermission) { permissions.requestPermission(permissions.CAMERA, open());
```

Thanks, @chrisrodriguezmbww !

### Barcodes too small?

Barcodes too far away from the camera, or a lens too close to the object
result in poor recognition rates and Quagga might respond with a lot of
false-positives.

Starting in Chrome 59 you can now make use of `capabilities` and directly
control the zoom of the camera. Head over to the
[web-cam demo](https://ericblade.github.io/quagga2/examples/live_w_locator.html)
and check out the __Zoom__ feature.

You can read more about those `capabilities` in
[Let's light a torch and explore MediaStreamTrack's capabilities](https://www.oberhofer.co/mediastreamtrack-and-its-capabilities)

### Video too dark?

Dark environments usually result in noisy images and therefore mess with the
recognition logic.

Since Chrome 59 you can turn on/off the __Torch__ of your device and vastly
improve the quality of the images. Head over to the
[web-cam demo](https://ericblade.github.io/quagga2/examples/live_w_locator.html)
and check out the __Torch__ feature.

To find out more about this feature [read on](https://www.oberhofer.co/mediastreamtrack-and-its-capabilities).

### Handling false positives

Most readers provide an error object that describes the confidence of the reader in it's accuracy.  There are strategies you can implement in your application to improve what your application accepts as acceptable input from the barcode scanner, [in this thread](https://github.com/serratus/quaggaJS/issues/237).

If you choose to explore check-digit validation, you might find [barcode-validator](https://github.com/ericblade/barcode-validator) a useful library.

## Tests

Tests are performed with [Cypress][cypressUrl] for browser testing, and [Mocha][mochaUrl], [Chai][chaiUrl], and [SinonJS][sinonUrl] for Node.JS testing. (note that Cypress also uses Mocha, Chai, and Sinon, so tests that are not browser specific can be run virtually identically in node without duplication of code)

Coverage reports are generated in the coverage/ folder.

```console
> npm install
> npm run test
```

Using Docker:

```console
> docker build --tag quagga2/build .
> docker run -v $(pwd):/quagga2 npm install
> docker run -v $(pwd):/quagga2 npm run test
```

or using docker-compose:

```console
> docker-compose run nodejs npm install
> docker-compose run nodejs npm run test
```

We prefer that Unit tests be located near the unit being tested -- the src/quagga/transform module, for example, has it's test suite located at src/quagga/test/transform.spec.ts.  Likewise, src/locator/barcode_locator test is located at src/locator/test/barcode_locator.spec.ts .

If you have browser or node specific tests, that must be written differently per platform, or do not apply to one platform, then you may add them to src/{filelocation}/test/browser or .../test/node.  See also src/analytics/test/browser/result_collector.spec.ts, which contains browser specific code.

If you add a new test file, you should also make sure to import it in either cypress/integration/browser.spec.ts, for browser-specific tests, or cypress/integration/universal.spec.ts, for tests that can be run both in node and in browser.  Node.JS testing is performed using the power of file globbing, and will pick up your tests, so long as they conform to the existing test file directory and name patterns.

## Image Debugging

In case you want to take a deeper dive into the inner workings of Quagga, get to
know the *debugging* capabilities of the current implementation. The various
flags exposed through the `config` object give you the ability to visualize
almost every step in the processing. Because of the introduction of the
web-workers, and their restriction not to have access to the DOM, the
configuration must be explicitly set to `config.numOfWorkers = 0` in order to
work.

## <a name="resultcollector">ResultCollector</a>

Quagga is not perfect by any means and may produce false positives from time
to time. In order to find out which images produced those false positives,
the built-in ``ResultCollector`` will support you and me helping squashing
bugs in the implementation.

### Creating a ``ResultCollector``

You can easily create a new ``ResultCollector`` by calling its ``create``
method with a configuration.

```javascript
var resultCollector = Quagga.ResultCollector.create({
    capture: true, // keep track of the image producing this result
    capacity: 20,  // maximum number of results to store
    blacklist: [   // list containing codes which should not be recorded
        {code: "3574660239843", format: "ean_13"}],
    filter: function(codeResult) {
        // only store results which match this constraint
        // returns true/false
        // e.g.: return codeResult.format === "ean_13";
        return true;
    }
});
```

### Using a ``ResultCollector``

After creating a ``ResultCollector`` you have to attach it to Quagga by
calling ``Quagga.registerResultCollector(resultCollector)``.

### Reading results

After a test/recording session, you can now print the collected results which
do not fit into a certain schema. Calling ``getResults`` on the
``resultCollector`` returns an ``Array`` containing objects with:

```javascript
{
    codeResult: {}, // same as in onDetected event
    frame: "data:image/png;base64,iVBOR..." // dataURL of the gray-scaled image
}
```

The ``frame`` property is an internal representation of the image and
therefore only available in gray-scale. The dataURL representation allows
easy saving/rendering of the image.

### Comparing results

Now, having the frames available on disk, you can load each single image by
calling ``decodeSingle`` with the same configuration as used during recording
. In order to reproduce the exact same result, you have to make sure to turn
on the ``singleChannel`` flag in the configuration when using ``decodeSingle``.

[zxing_github]: https://github.com/zxing/zxing
[teaser_left]: https://raw.githubusercontent.com/serratus/quaggaJS/master/doc/img/mobile-located.png
[teaser_right]: https://raw.githubusercontent.com/serratus/quaggaJS/master/doc/img/mobile-detected.png
[caniuse_getusermedia]: http://caniuse.com/#feat=stream
[cypressUrl]: https://www.cypress.io/
[sinonUrl]: http://sinonjs.org/
[chaiUrl]: http://chaijs.com/
[mochaUrl]: https://github.com/mochajs/mocha
[code39_wiki]: http://en.wikipedia.org/wiki/Code_39
[codabar_wiki]: http://en.wikipedia.org/wiki/Codabar
[upc_wiki]: http://en.wikipedia.org/wiki/Universal_Product_Code
[ean_8_wiki]: http://en.wikipedia.org/wiki/EAN-8
[oberhofer_co_how]: http://www.oberhofer.co/how-barcode-localization-works-in-quaggajs/
[github_examples]: https://ericblade.github.io/quagga2/examples
[i2of5_wiki]: https://en.wikipedia.org/wiki/Interleaved_2_of_5
[enumerateDevices]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
[reactExample]: https://github.com/ericblade/quagga2-react-example
[issue-94-comment]: https://github.com/serratus/quaggajs/issues/94#issuecomment-571478711
#### Sequence Mode

Quagga2 supports loading a sequence of images for batch processing using the `inputStream.sequence` option. When enabled, Quagga will attempt to load images named in the pattern `image-001.jpg`, `image-002.jpg`, etc., from the specified directory.

**Example:**
```javascript
Quagga.init({
  inputStream: {
    type: 'ImageStream',
    sequence: true,
    size: 3, // Number of images to load
    offset: 1, // Starting index (optional)
    src: '/path/to/images/', // Base path for images
  },
  decoder: { readers: ['code_128_reader'] }
});
```

This will load `/path/to/images/image-001.jpg`, `/path/to/images/image-002.jpg`, `/path/to/images/image-003.jpg` for processing.

Sequence mode is useful for batch testing or processing multiple images with predictable filenames.
