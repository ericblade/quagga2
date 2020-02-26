
## <a name="changelog">Changelog</a>

- Future changelogs will be posted to the github [releases page](https://github.com/ericblade/quagga2/releases)

### 2019-08-13
- Forked to @ericblade/quagga2
  - Significantly decrease npm package size by not adding files that were not needed
  - Clarify iOS support in documentation
  - Updated typescript typings
  - drawRect accepts style.lineWidth

### 2017-06-07
- Improvements
  - added `muted` and `playsinline` to `<video/>` to make it work for Safari 11
  Beta (even iOS)
- Fixes
  - Fixed  [example/live_w_locator.js](https://github.com/serratus/quaggaJS/blob/master/example/live_w_locator.js)

### 2017-06-06
- Features
  - Support for Standard 2of5 barcodes (See
      [\#194](https://github.com/serratus/quaggaJS/issues/194))
  - Support for Code 93 barcodes (See
      [\#194](https://github.com/serratus/quaggaJS/issues/195))
  - Exposing `Quagga.CameraAccess.getActiveTrack()` to get access to the
      currently used `MediaStreamTrack`
    - Example can be viewed here: [example/live_w_locator.js](https://github.com/serratus/quaggaJS/blob/master/example/live_w_locator.js) and a [demo](https://serratus.github.io/quaggaJS/examples/live_w_locator.html)

Take a look at the release-notes (
    [0.12.0](https://github.com/serratus/quaggaJS/releases/tag/v0.12.0))

### 2017-01-08
- Improvements
  - Exposing `CameraAccess` module to get access to methods like
    `enumerateVideoDevices` and `getActiveStreamLabel`
    (see `example/live_w_locator`)
  - Update to webpack 2.2 (API is still unstable)

### 2016-10-03
- Fixes
  - Fixed `facingMode` issue with Chrome >= 53 (see [#128](https://github.com/serratus/quaggaJS/issues/128))

### 2016-08-15
- Features
  - Proper handling of EXIF orientation when using `Quagga.decodeSingle`
  (see [#121](https://github.com/serratus/quaggaJS/issues/121))

### 2016-04-24
- Features
  - EAN-13 extended codes can now be decoded (See
      [\#71](https://github.com/serratus/quaggaJS/issues/71))

Take a look at the release-notes (
    [0.11.0](https://github.com/serratus/quaggaJS/releases/tag/v0.11.0))

### 2016-04-19
- Improvements
  - Reducing false-positives for Code 128 barcodes (
      addresses [\#104](https://github.com/serratus/quaggaJS/issues/104))

### 2016-03-31
Take a look at the release-notes (
    [0.10.0](https://github.com/serratus/quaggaJS/releases/tag/v0.10.0))

### 2016-02-18

- Internal Changes
  - Restructuring into meaningful folders
  - Removing debug-code in production build


### 2016-02-15
Take a look at the release-notes (
    [0.9.0](https://github.com/serratus/quaggaJS/releases/tag/v0.9.0))

### 2015-11-22

- Fixes
  - Fixed inconsistencies for Code 128 decoding (See
      [\#76](https://github.com/serratus/quaggaJS/issues/76))

### 2015-11-15

- Fixes
  - Fixed inconsistency in Code 39 decoding
  - added inline-source-map to quagga.js file

### 2015-10-13
Take a look at the release-notes ([0.8.0]
(https://github.com/serratus/quaggaJS/releases/tag/v0.8.0))

- Improvements
  - Replaced RequireJS with webpack

### 2015-09-15
Take a look at the release-notes ([0.7.0]
(https://github.com/serratus/quaggaJS/releases/tag/v0.7.0))

- Features
  - Added basic support for running QuaggaJS inside __node__ (see [example]
  (#node-example))

### 2015-08-29
- Improvements
  - Added support for Internet Explorer (only Edge+ supports `getUserMedia`)

### 2015-08-13
- Improvements
  - Added `offProcessed` and `offDetected` methods for detaching event-
  listeners from the event-queue.

### 2015-07-29
- Features
  - Added basic support for [ITF][i2of5_wiki] barcodes (`i2of5_reader`)

### 2015-07-08
- Improvements
  - Parameter tweaking to reduce false-positives significantly (for the
  entire EAN and UPC family)
  - Fixing bug in parity check for UPC-E codes
  - Fixing bug in alignment for EAN-8 codes

### 2015-07-06
- Improvements
  - Added `err` parameter to [Quagga.init()](#quaggainit) callback
  function

### 2015-06-21
- Features
  - Added ``singleChannel`` configuration to ``inputStream`` (in [config]
  (#configobject))
  - Added ``ResultCollector`` functionality (see [ResultCollector]
  (#resultcollector))

### 2015-06-13
- Improvements
  - Added ``format`` property to ``codeResult`` (in [result](#resultobject))

### 2015-06-13
- Improvements
  - Added fixes for ``Code39Reader`` (trailing whitespace was missing)

### 2015-06-09
- Features
  - Introduced the ``area`` property
  - Ability to define a rectangle where localization/decoding should be applied

### 2015-05-20
- Improvements
  - Making EAN and UPC readers even more restrictive
  - Added example using requirejs

### 2015-05-18
- Improvements
  - Making EAN and UPC readers more restrictive
  - Added integration-tests for all barcode-readers

### 2015-05-09
- Improvements
  - Odd image dimensions no longer cause problems

### 2015-04-30
- Features
  - Added support for [UPC-A and UPC-E][upc_wiki] barcodes
  - Added support for [EAN-8][ean_8_wiki] barcodes
- Improvements
  - Added extended configuration to the live-video example
  - Releasing resources when calling ``Quagga.stop()``

### 2015-04-25
- Improvements
  - Added extended configuration to the file-input example
  - Configurable ``patchSize`` for better adjustment to small/medium/large
      barcodes

### 2015-04-16
- Features
  - Added support for [Codabar][codabar_wiki] barcodes

### 2015-03-16
- Improvements
  - now includes minified version (23.3KB gzipped)
  - No need for configuration of script-name any more

### 2015-03-12
- Improvements
  - removed dependency on async.js

### 2015-03-04
- Features
  - Added support for [Code 39][code39_wiki] barcodes

### 2015-01-21
- Features
  - Added support for web-worker (using 4 workers as default, can be changed
  through `config.numOfWorkers`)
  - Due to the way how web-workers are created, the name of the script file
  (`config.scriptName`) should be kept in sync with your actual filename
  - Removed canvas-overlay for decoding (boxes & scanline) which can now be
  easily implemented using the existing API (see example)
- API Changes
In the course of implementing web-workers some breaking changes were
introduced to the API.
  - The `Quagga.init` function no longer receives the callback as part of the
   config but rather as a second argument: `Quagga.init(config, cb)`
  - The callback to `Quagga.onDetected` now receives an object containing
  much more information in addition to the decoded code.(see
  [data](#resultobject))
  - Added `Quagga.onProcessed(callback)` which provides a way to get information
  for each image processed. The callback receives the same `data` object as
  `Quagga.onDetected` does. Depending on the success of the process the `data`
  object might not contain any `resultCode` and/or `box` properties.
