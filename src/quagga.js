import TypeDefs from './common/typedefs'; // eslint-disable-line no-unused-vars
import ImageWrapper from './common/image_wrapper';
import BarcodeDecoder from './decoder/barcode_decoder';
import BarcodeReader from './reader/barcode_reader';
import Events from './common/events';
import CameraAccess from './input/camera_access';
import ImageDebug from './common/image_debug';
import ResultCollector from './analytics/result_collector';
import Config from './config/config';
import { merge } from 'lodash';

import Quagga from './quagga/quagga';

const instance = new Quagga();
const _context = instance.context;

const QuaggaJSStaticInterface = {
    init: function (config, cb, imageWrapper, quaggaInstance = instance) {
        quaggaInstance.context.config = merge({}, Config, config);
        // TODO: pending restructure in Issue #105, we are temp disabling workers
        if (quaggaInstance.context.config.numOfWorkers > 0) {
            quaggaInstance.context.config.numOfWorkers = 0;
        }
        if (imageWrapper) {
            quaggaInstance.context.onUIThread = false;
            quaggaInstance.initializeData(imageWrapper);
            if (cb) {
                cb();
            }
        } else {
            quaggaInstance.initInputStream(cb);
        }
    },
    start: function () {
        instance.start();
    },
    stop: function () {
        instance.stop();
    },
    pause: function () {
        _context.stopped = true;
    },
    onDetected: function (callback) {
        Events.subscribe('detected', callback);
    },
    offDetected: function (callback) {
        Events.unsubscribe('detected', callback);
    },
    onProcessed: function (callback) {
        Events.subscribe('processed', callback);
    },
    offProcessed: function (callback) {
        Events.unsubscribe('processed', callback);
    },
    setReaders: function (readers) {
        instance.setReaders(readers);
    },
    registerReader: function (name, reader) {
        instance.registerReader(name, reader);
    },
    registerResultCollector: function (resultCollector) {
        if (resultCollector && typeof resultCollector.addResult === 'function') {
            _context.resultCollector = resultCollector;
        }
    },
    get canvas() {
        return _context.canvasContainer;
    },
    decodeSingle: function (config, resultCallback) {
        const quaggaInstance = new Quagga();
        if (this.inDecodeSingle) {
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
        // this.inDecodeSingle = true;
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
                        quaggaInstance.stop();
                        if (resultCallback) {
                            resultCallback.call(null, result);
                        }
                        resolve(result);
                    }, true);
                    quaggaInstance.start();
                }, null, quaggaInstance);
            } catch (err) {
                this.inDecodeSingle = false;
                reject(err);
            }
        });
    },
    // add the usually expected "default" for use with require, build step won't allow us to
    // write to module.exports so do it here.
    get default() {
        return QuaggaJSStaticInterface;
    },
    BarcodeReader,
    CameraAccess,
    ImageDebug,
    ImageWrapper,
    ResultCollector,
};

export default QuaggaJSStaticInterface;
// export BarcodeReader and other utilities for external plugins
export {
    BarcodeDecoder,
    BarcodeReader,
    CameraAccess,
    ImageDebug,
    ImageWrapper,
    ResultCollector,
};
