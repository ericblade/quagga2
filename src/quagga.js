import TypeDefs from './common/typedefs'; // eslint-disable-line no-unused-vars
import ImageWrapper from './common/image_wrapper';
import BarcodeLocator from './locator/barcode_locator';
import BarcodeDecoder from './decoder/barcode_decoder';
import BarcodeReader from './reader/barcode_reader';
import Events from './common/events';
import CameraAccess from './input/camera_access.ts';
import ImageDebug from './common/image_debug.ts';
import ResultCollector from './analytics/result_collector.ts';
import Config from './config/config';
import BrowserInputStream, { NodeInputStream } from './input/input_stream';
import BrowserFrameGrabber, { NodeFrameGrabber } from './input/frame_grabber';
import { merge } from 'lodash';
import { clone } from 'gl-vec2';

import setupInputStream from './quagga/setupInputStream.ts';
import _getViewPort from './quagga/getViewPort.ts';
import _initBuffers from './quagga/initBuffers.ts';
import _initCanvas from './quagga/initCanvas';

const vec2 = { clone };

const InputStream = typeof window === 'undefined' ? NodeInputStream : BrowserInputStream;
const FrameGrabber = typeof window === 'undefined' ? NodeFrameGrabber : BrowserFrameGrabber;

// export BarcodeReader and other utilities for external plugins
export { BarcodeReader, BarcodeDecoder, ImageWrapper, ImageDebug, ResultCollector, CameraAccess };

let _inputStream;
let _framegrabber;
let _stopped;

const _canvasContainer = {
    ctx: {
        image: null,
        overlay: null,
    },
    dom: {
        image: null,
        overlay: null,
    },
};

let _inputImageWrapper;
let _boxSize;
let _decoder;
let _workerPool = [];
let _onUIThread = true;
let _resultCollector;
let _config = {};

function initBuffers(imageWrapper) {
    const { inputImageWrapper, boxSize } = _initBuffers(_inputStream, imageWrapper, _config.locator);
    _inputImageWrapper = inputImageWrapper;
    _boxSize = boxSize;
}

function initializeData(imageWrapper) {
    initBuffers(imageWrapper);
    _decoder = BarcodeDecoder.create(_config.decoder, _inputImageWrapper);
}

function getViewPort() {
    const { target } = _config.inputStream;
    return _getViewPort(target);
}

function ready(cb) {
    _inputStream.play();
    cb();
}

function initCanvas() {
    _initCanvas(getViewPort(), _canvasContainer, _config.inputStream.type, _inputStream);
}

function canRecord(cb) {
    BarcodeLocator.checkImageConstraints(_inputStream, _config.locator);
    initCanvas(_config);
    _framegrabber = FrameGrabber.create(_inputStream, _canvasContainer.dom.image);

    adjustWorkerPool(_config.numOfWorkers, function () {
        if (_config.numOfWorkers === 0) {
            initializeData();
        }
        ready(cb);
    });
}

function initInputStream(cb) {
    const { type: inputType, constraints } = _config.inputStream;
    const { video, inputStream } = setupInputStream(inputType, getViewPort(), InputStream);

    if (inputType === 'LiveStream') {
        CameraAccess.request(video, constraints)
            .then(() => inputStream.trigger('canrecord'))
            .catch((err) => cb(err));
    }

    inputStream.setAttribute('preload', 'auto');
    inputStream.setInputStream(_config.inputStream);
    inputStream.addEventListener('canrecord', canRecord.bind(undefined, cb));

    _inputStream = inputStream;
}

function getBoundingBoxes() {
    if (_config.locate) {
        return BarcodeLocator.locate();
    } else {
        return [[
            vec2.clone(_boxSize[0]),
            vec2.clone(_boxSize[1]),
            vec2.clone(_boxSize[2]),
            vec2.clone(_boxSize[3])]];
    }
}

function transformResult(result) {
    var topRight = _inputStream.getTopRight(),
        xOffset = topRight.x,
        yOffset = topRight.y,
        i;

    if (xOffset === 0 && yOffset === 0) {
        return;
    }

    if (result.barcodes) {
        for (i = 0; i < result.barcodes.length; i++) {
            transformResult(result.barcodes[i]);
        }
    }

    if (result.line && result.line.length === 2) {
        moveLine(result.line);
    }

    if (result.box) {
        moveBox(result.box);
    }

    if (result.boxes && result.boxes.length > 0) {
        for (i = 0; i < result.boxes.length; i++) {
            moveBox(result.boxes[i]);
        }
    }

    function moveBox(box) {
        var corner = box.length;

        while (corner--) {
            box[corner][0] += xOffset;
            box[corner][1] += yOffset;
        }
    }

    function moveLine(line) {
        line[0].x += xOffset;
        line[0].y += yOffset;
        line[1].x += xOffset;
        line[1].y += yOffset;
    }
}

function addResult (result, imageData) {
    if (!imageData || !_resultCollector) {
        return;
    }

    if (result.barcodes) {
        result.barcodes.filter(barcode => barcode.codeResult)
            .forEach(barcode => addResult(barcode, imageData));
    } else if (result.codeResult) {
        _resultCollector.addResult(imageData, _inputStream.getCanvasSize(), result.codeResult);
    }
}

function hasCodeResult (result) {
    return result && (result.barcodes ?
        result.barcodes.some(barcode => barcode.codeResult) :
        result.codeResult);
}

function publishResult(result, imageData) {
    let resultToPublish = result;

    if (result && _onUIThread) {
        transformResult(result);
        addResult(result, imageData);
        resultToPublish = result.barcodes || result;
    }

    Events.publish('processed', resultToPublish);
    if (hasCodeResult(result)) {
        Events.publish('detected', resultToPublish);
    }
}

function locateAndDecode() {
    const boxes = getBoundingBoxes();

    if (boxes) {
        const decodeResult = _decoder.decodeFromBoundingBoxes(boxes) || {};
        decodeResult.boxes = boxes;
        publishResult(decodeResult, _inputImageWrapper.data);
    } else {
        const imageResult = _decoder.decodeFromImage(_inputImageWrapper);
        if (imageResult) {
            publishResult(imageResult, _inputImageWrapper.data);
        } else {
            publishResult();
        }
    }
}

function update() {
    var availableWorker;

    if (_onUIThread) {
        if (_workerPool.length > 0) {
            availableWorker = _workerPool.filter(function(workerThread) {
                return !workerThread.busy;
            })[0];
            if (availableWorker) {
                _framegrabber.attachData(availableWorker.imageData);
            } else {
                return; // all workers are busy
            }
        } else {
            _framegrabber.attachData(_inputImageWrapper.data);
        }
        if (_framegrabber.grab()) {
            if (availableWorker) {
                availableWorker.busy = true;
                availableWorker.worker.postMessage({
                    cmd: 'process',
                    imageData: availableWorker.imageData,
                }, [availableWorker.imageData.buffer]);
            } else {
                locateAndDecode();
            }
        }
    } else {
        locateAndDecode();
    }
}

function startContinuousUpdate() {
    var next = null,
        delay = 1000 / (_config.frequency || 60);

    _stopped = false;
    (function frame(timestamp) {
        next = next || timestamp;
        if (!_stopped) {
            if (timestamp >= next) {
                next += delay;
                update();
            }
            window.requestAnimFrame(frame);
        }
    }(performance.now()));
}

function start() {
    if (_onUIThread && _config.inputStream.type === 'LiveStream') {
        startContinuousUpdate();
    } else {
        update();
    }
}

function initWorker(cb) {
    var blobURL,
        workerThread = {
            worker: undefined,
            imageData: new Uint8Array(_inputStream.getWidth() * _inputStream.getHeight()),
            busy: true,
        };

    blobURL = generateWorkerBlob();
    workerThread.worker = new Worker(blobURL);

    workerThread.worker.onmessage = function(e) {
        if (e.data.event === 'initialized') {
            URL.revokeObjectURL(blobURL);
            workerThread.busy = false;
            workerThread.imageData = new Uint8Array(e.data.imageData);
            if (ENV.development) {
                console.log('Worker initialized');
            }
            cb(workerThread);
        } else if (e.data.event === 'processed') {
            workerThread.imageData = new Uint8Array(e.data.imageData);
            workerThread.busy = false;
            publishResult(e.data.result, workerThread.imageData);
        } else if (e.data.event === 'error') {
            if (ENV.development) {
                console.log('Worker error: ' + e.data.message);
            }
        }
    };

    workerThread.worker.postMessage({
        cmd: 'init',
        size: {x: _inputStream.getWidth(), y: _inputStream.getHeight()},
        imageData: workerThread.imageData,
        config: configForWorker(_config),
    }, [workerThread.imageData.buffer]);
}

function configForWorker(config) {
    return {
        ...config,
        inputStream: {
            ...config.inputStream,
            target: null,
        },
    };
}

function workerInterface(factory) {
    if (factory) {
        var Quagga = factory().default;
        if (!Quagga) {
            self.postMessage({'event': 'error', message: 'Quagga could not be created'});
            return;
        }
    }
    var imageWrapper;

    function onProcessed(result) {
        self.postMessage({
            'event': 'processed',
            imageData: imageWrapper.data,
            result: result,
        }, [imageWrapper.data.buffer]);
    }

    function workerInterfaceReady() {
        self.postMessage({
            'event': 'initialized',
            imageData: imageWrapper.data,
        }, [imageWrapper.data.buffer]);
    }

    self.onmessage = function(e) {
        if (e.data.cmd === 'init') {
            var config = e.data.config;
            config.numOfWorkers = 0;
            imageWrapper = new Quagga.ImageWrapper({
                x: e.data.size.x,
                y: e.data.size.y,
            }, new Uint8Array(e.data.imageData));
            Quagga.init(config, workerInterfaceReady, imageWrapper);
            Quagga.onProcessed(onProcessed);
        } else if (e.data.cmd === 'process') {
            imageWrapper.data = new Uint8Array(e.data.imageData);
            Quagga.start();
        } else if (e.data.cmd === 'setReaders') {
            Quagga.setReaders(e.data.readers);
        } else if (e.data.cmd === 'registerReader') {
            Quagga.registerReader(e.data.name, e.data.reader);
        }
    };
}

function generateWorkerBlob() {
    var blob,
        factorySource;

    /* jshint ignore:start */
    if (typeof __factorySource__ !== 'undefined') {
        factorySource = __factorySource__; // eslint-disable-line no-undef
    }
    /* jshint ignore:end */

    blob = new Blob(['(' + workerInterface.toString() + ')(' + factorySource + ');'],
        {type: 'text/javascript'});

    return window.URL.createObjectURL(blob);
}

function setReaders(readers) {
    if (_decoder) {
        _decoder.setReaders(readers);
    } else if (_onUIThread && _workerPool.length > 0) {
        _workerPool.forEach(function(workerThread) {
            workerThread.worker.postMessage({cmd: 'setReaders', readers: readers});
        });
    }
}

function registerReader(name, reader) {
    // load it to the module
    BarcodeDecoder.registerReader(name, reader);
    // then make sure any running instances of decoder and workers know about it
    if (_decoder) {
        _decoder.registerReader(name, reader);
    } else if (_onUIThread && _workerPool.length > 0) {
        _workerPool.forEach(function(workerThread) {
            workerThread.worker.postMessage({ cmd: 'registerReader', name, reader });
        });
    }
}

function adjustWorkerPool(capacity, cb) {
    const increaseBy = capacity - _workerPool.length;
    if (increaseBy === 0 && cb) {
        cb();
    } else if (increaseBy < 0) {
        const workersToTerminate = _workerPool.slice(increaseBy);
        workersToTerminate.forEach(function(workerThread) {
            workerThread.worker.terminate();
            if (ENV.development) {
                console.log('Worker terminated!');
            }
        });
        _workerPool = _workerPool.slice(0, increaseBy);
        if (cb) {
            cb();
        }
    } else {
        const workerInitialized = (workerThread) => {
            _workerPool.push(workerThread);
            if (_workerPool.length >= capacity && cb) {
                cb();
            }
        };

        for (var i = 0; i < increaseBy; i++) {
            initWorker(workerInitialized);
        }
    }
}

export default {
    init: function(config, cb, imageWrapper) {
        _config = merge({}, Config, config);
        // TODO: pending restructure in Issue #105, we are temp disabling workers
        if (_config.numOfWorkers > 0) {
            _config.numOfWorkers = 0;
        }
        if (imageWrapper) {
            _onUIThread = false;
            initializeData(imageWrapper);
            if (cb) {
                cb();
            }
        } else {
            initInputStream(cb);
        }
    },
    start: function() {
        start();
    },
    stop: function() {
        _stopped = true;
        adjustWorkerPool(0);
        if (_config.inputStream && _config.inputStream.type === 'LiveStream') {
            CameraAccess.release();
            _inputStream.clearEventHandlers();
        }
    },
    pause: function() {
        _stopped = true;
    },
    onDetected: function(callback) {
        Events.subscribe('detected', callback);
    },
    offDetected: function(callback) {
        Events.unsubscribe('detected', callback);
    },
    onProcessed: function(callback) {
        Events.subscribe('processed', callback);
    },
    offProcessed: function(callback) {
        Events.unsubscribe('processed', callback);
    },
    setReaders: function(readers) {
        setReaders(readers);
    },
    registerReader: function(name, reader) {
        registerReader(name, reader);
    },
    registerResultCollector: function(resultCollector) {
        if (resultCollector && typeof resultCollector.addResult === 'function') {
            _resultCollector = resultCollector;
        }
    },
    canvas: _canvasContainer,
    decodeSingle: function(config, resultCallback) {
        if (this.inDecodeSingle) {
            console.warn('* running multiple decodes in serial');
            // force multiple calls to decodeSingle to run in serial, because presently
            // simultaneous running breaks things.
            if (resultCallback) {
                setTimeout(() => this.decodeSingle(config, resultCallback), 300);
            } else {
                return new Promise((resolve) => {
                    setTimeout(() => this.decodeSingle(config, (res) => {
                        resolve(res);
                    }, 300));
                });
            }
            return null;
        }
        this.inDecodeSingle = true;
        config = merge({
            inputStream: {
                type: 'ImageStream',
                sequence: false,
                size: 800,
                src: config.src,
            },
            numOfWorkers: (ENV.development && config.debug) ? 0 : 1,
            locator: {
                halfSample: false,
            },
        }, config);
        // TODO: restructure worker support so that it will work with typescript using worker-loader
        // https://webpack.js.org/loaders/worker-loader/
        if (config.numOfWorkers > 0) {
            config.numOfWorkers = 0;
        }
        // workers require Worker and Blob support presently, so if no Blob or Worker then set
        // workers to 0.
        if (config.numOfWorkers > 0 && (typeof Blob === 'undefined' || typeof Worker === 'undefined')) {
            console.warn('* no Worker and/or Blob support - forcing numOfWorkers to 0');
            config.numOfWorkers = 0;
        }
        return new Promise((resolve, reject) => {
            try {
                this.init(config, () => {
                    Events.once('processed', (result) => {
                        this.inDecodeSingle = false;
                        this.stop();
                        if (resultCallback) {
                            resultCallback.call(null, result);
                        }
                        resolve(result);
                    }, true);
                    start();
                });
            } catch (err) {
                this.inDecodeSingle = false;
                reject(err);
            }
        });
    },
    ImageWrapper: ImageWrapper,
    ImageDebug: ImageDebug,
    ResultCollector: ResultCollector,
    CameraAccess: CameraAccess,
    BarcodeReader,
};
