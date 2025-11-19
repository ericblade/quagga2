/* Worker functions. These are straight from the original quagga.js file.
 * Not presently used, as worker support is non-functional.  Keeping them around temporarily
 * to refer to until it is re-implemented. We may be able to fix/use some of this.
 */

import { QuaggaJSConfigObject, QuaggaJSReaderConfig } from "../../type-definitions/quagga";

// TODO: need a typescript interface for FrameGrabber

interface QWorkerThread {
    imageData: Uint8Array;
    busy: boolean;
    worker: Worker;
}

let workerPool: Array<QWorkerThread> = [];

export function updateWorkers(frameGrabber: any) {
    let availableWorker: QWorkerThread;
    if (workerPool.length) {
        availableWorker = workerPool.filter((workerThread) => !workerThread.busy)[0];
        if (availableWorker) {
            frameGrabber.attachData(availableWorker.imageData);
            if (frameGrabber.grab()) {
                availableWorker.busy = true;
                availableWorker.worker.postMessage({
                    cmd: 'process',
                    imageData: availableWorker.imageData,
                }, [availableWorker.imageData.buffer]);
            }
            return true;
        } else {
            return false;
        }
    }
    return null;
}

function configForWorker(config: QuaggaJSConfigObject) {
    return {
        ...config,
        inputStream: {
            ...config.inputStream,
            target: null,
        },
    };
}

// @ts-ignore
function workerInterface(factory) {
    if (factory) {
        var Quagga = factory().default;
        if (!Quagga) {
// @ts-ignore
            self.postMessage({ 'event': 'error', message: 'Quagga could not be created' });
            return;
        }
    }
// @ts-ignore
    var imageWrapper;

// @ts-ignore
    function onProcessed(result) {
        self.postMessage({
            'event': 'processed',
// @ts-ignore
            imageData: imageWrapper.data,
            result: result,
// @ts-ignore
        }, [imageWrapper.data.buffer]);
    }

    function workerInterfaceReady() {
        self.postMessage({
            'event': 'initialized',
// @ts-ignore
            imageData: imageWrapper.data,
// @ts-ignore
        }, [imageWrapper.data.buffer]);
    }

// @ts-ignore
    self.onmessage = function (e) {
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
// @ts-ignore
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
    // @ts-ignore
    if (typeof __factorySource__ !== 'undefined') {
        // @ts-ignore
        factorySource = __factorySource__; // eslint-disable-line no-undef
    }
    /* jshint ignore:end */

    blob = new Blob(['(' + workerInterface.toString() + ')(' + factorySource + ');'],
        { type: 'text/javascript' });

    return window.URL.createObjectURL(blob);
}

export function initWorker(config: QuaggaJSConfigObject, inputStream: any, cb: Function) {
    const blobURL = generateWorkerBlob();
    const worker = new Worker(blobURL);

    const workerThread: QWorkerThread = {
        worker,
        imageData: new Uint8Array(inputStream.getWidth() * inputStream.getHeight()),
        busy: true,
    };

    workerThread.worker.onmessage = function (e) {
        if (e.data.event === 'initialized') {
            URL.revokeObjectURL(blobURL);
            workerThread.busy = false;
            workerThread.imageData = new Uint8Array(e.data.imageData);
            if (typeof ENV !== 'undefined' && ENV.development) {
                console.log('Worker initialized');
            }
            cb(workerThread);
        } else if (e.data.event === 'processed') {
            workerThread.imageData = new Uint8Array(e.data.imageData);
            workerThread.busy = false;
            // TODO: how to thread publishResult into here? TypeScript says it's not here. https://github.com/ericblade/quagga2/issues/466#issuecomment-1724248080 says it's necessary?
            // @ts-ignore
            if (typeof publishResult !== 'undefined') {
                // @ts-ignore
                publishResult(e.data.result, workerThread.imageData);
            }
        } else if (e.data.event === 'error') {
            if (typeof ENV !== 'undefined' && ENV.development) {
                console.log('Worker error: ' + e.data.message);
            }
        }
    };

    workerThread.worker.postMessage({
        cmd: 'init',
        size: { x: inputStream.getWidth(), y: inputStream.getHeight() },
        imageData: workerThread.imageData,
        config: configForWorker(config),
    }, [workerThread.imageData.buffer]);
}

export function adjustWorkerPool(capacity: number, config?: QuaggaJSConfigObject, inputStream?: any, cb?: Function) {
    const increaseBy = capacity - workerPool.length;
    if (increaseBy === 0 && cb) {
        cb();
    } else if (increaseBy < 0) {
        const workersToTerminate = workerPool.slice(increaseBy);
        workersToTerminate.forEach(function (workerThread) {
            workerThread.worker.terminate();
            if (typeof ENV !== 'undefined' && ENV.development) {
                console.log('Worker terminated!');
            }
        });
        workerPool = workerPool.slice(0, increaseBy);
        if (cb) {
            cb();
        }
    } else {
        const workerInitialized = (workerThread: QWorkerThread) => {
            workerPool.push(workerThread);
            if (workerPool.length >= capacity && cb) {
                cb();
            }
        };

        if (config) {
            for (let i = 0; i < increaseBy; i++) {
                initWorker(config, inputStream, workerInitialized);
            }
        }
    }
}

export function setReaders(readers: Array<QuaggaJSReaderConfig>) {
    workerPool.forEach((workerThread) => workerThread.worker.postMessage({ cmd: 'setReaders', readers }));
}

export function registerReader(name: string, reader: any) {
    workerPool.forEach((workerThread) => workerThread.worker.postMessage({ cmd: 'registerReader', name, reader }));
}
