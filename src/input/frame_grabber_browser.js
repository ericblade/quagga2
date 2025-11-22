// NOTE FOR ANYONE IN HERE IN THE FUTURE:
// webpack.config.js replaces the frame_grabber module with THIS module when it is building for a Browser environment.

import {
    imageRef,
    grayAndHalfSampleFromCanvasData,
    computeGray,
} from '../common/cv_utils';

const TO_RADIANS = Math.PI / 180;

function adjustCanvasSize(canvas, targetSize, debug) {
    if (canvas.width !== targetSize.x) {
        if (typeof ENV !== 'undefined' && ENV.development && debug?.showImageDetails) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        canvas.width = targetSize.x;
    }
    if (canvas.height !== targetSize.y) {
        if (typeof ENV !== 'undefined' && ENV.development && debug?.showImageDetails) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        canvas.height = targetSize.y;
    }
}

const FrameGrabber = {};

FrameGrabber.create = function (inputStream, canvas) {
    // console.warn('*** FrameGrabberBrowser create');
    const _that = {};
    const _streamConfig = inputStream.getConfig();
    const _videoSize = imageRef(inputStream.getRealWidth(), inputStream.getRealHeight());
    const _canvasSize = inputStream.getCanvasSize();
    const _size = imageRef(inputStream.getWidth(), inputStream.getHeight());
    const topRight = inputStream.getTopRight();
    const _sx = topRight.x;
    const _sy = topRight.y;
    let _canvas;
    let _ctx = null;
    let _data = null;
    const { willReadFrequently } = _streamConfig;

    _canvas = canvas || document.createElement('canvas');
    _canvas.width = _canvasSize.x;
    _canvas.height = _canvasSize.y;
    if (typeof ENV !== 'undefined' && ENV.development && _streamConfig.debug?.showImageDetails) {
        console.warn('*** frame_grabber_browser: willReadFrequently=', willReadFrequently, 'canvas=', _canvas);
    }
    _ctx = _canvas.getContext('2d', { willReadFrequently: !!willReadFrequently }); // double not because we have an optional bool that needs to pass as a bool
    _data = new Uint8Array(_size.x * _size.y);
    if (typeof ENV !== 'undefined' && ENV.development && _streamConfig.debug?.showImageDetails) {
        console.log('FrameGrabber', JSON.stringify({
            size: _size,
            topRight,
            videoSize: _videoSize,
            canvasSize: _canvasSize,
        }));
    }

    /**
     * Uses the given array as frame-buffer
     */
    _that.attachData = function (data) {
        _data = data;
    };

    /**
     * Returns the used frame-buffer
     */
    _that.getData = function () {
        return _data;
    };

    // Bilinear interpolation for grayscale data (to match Node's behavior)
    function bilinearInterpolate(grayData, width, height, x, y) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(x0 + 1, width - 1);
        const y1 = Math.min(y0 + 1, height - 1);
        
        const fx = x - x0;
        const fy = y - y0;
        
        const v00 = grayData[y0 * width + x0];
        const v10 = grayData[y0 * width + x1];
        const v01 = grayData[y1 * width + x0];
        const v11 = grayData[y1 * width + x1];
        
        const v0 = v00 * (1 - fx) + v10 * fx;
        const v1 = v01 * (1 - fx) + v11 * fx;
        
        return v0 * (1 - fy) + v1 * fy;
    }

    /**
     * Fetches a frame from the input-stream and puts into the frame-buffer.
     * The image-data is converted to gray-scale and then half-sampled if configured.
     * 
     * IMPORTANT: This now matches Node's processing order to ensure consistent results:
     * 1. Draw image at original size
     * 2. Convert RGB to grayscale
     * 3. Scale grayscale data using bilinear interpolation
     * 4. Crop to target region
     */
    _that.grab = function () {
        const doHalfSample = _streamConfig.halfSample;
        const frame = inputStream.getFrame();
        let drawable = frame;
        let drawAngle = 0;
        
        if (drawable) {
            if (_streamConfig.type === 'ImageStream') {
                drawable = frame.img;
                if (frame.tags && frame.tags.orientation) {
                    switch (frame.tags.orientation) {
                        case 6:
                            drawAngle = 90 * TO_RADIANS;
                            break;
                        case 8:
                            drawAngle = -90 * TO_RADIANS;
                            break;
                    }
                }
            }

            // Step 1: Draw image at ORIGINAL size (not scaled to canvas size yet)
            // Create a temporary canvas for the original-sized image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = _videoSize.x;
            tempCanvas.height = _videoSize.y;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (drawAngle !== 0) {
                tempCtx.translate(_videoSize.x / 2, _videoSize.y / 2);
                tempCtx.rotate(drawAngle);
                tempCtx.drawImage(drawable, -_videoSize.y / 2, -_videoSize.x / 2, _videoSize.y, _videoSize.x);
            } else {
                tempCtx.drawImage(drawable, 0, 0, _videoSize.x, _videoSize.y);
            }

            // Step 2: Convert RGB to grayscale at original size
            const originalImageData = tempCtx.getImageData(0, 0, _videoSize.x, _videoSize.y).data;
            const grayData = new Uint8Array(_videoSize.x * _videoSize.y);
            computeGray(originalImageData, grayData, _streamConfig);

            if (doHalfSample) {
                // For half-sampling, we still need the scaled RGB canvas approach
                adjustCanvasSize(_canvas, _canvasSize, _streamConfig.debug);
                if (drawAngle !== 0) {
                    _ctx.translate(_canvasSize.x / 2, _canvasSize.y / 2);
                    _ctx.rotate(drawAngle);
                    _ctx.drawImage(drawable, -_canvasSize.y / 2, -_canvasSize.x / 2, _canvasSize.y, _canvasSize.x);
                    _ctx.rotate(-drawAngle);
                    _ctx.translate(-_canvasSize.x / 2, -_canvasSize.y / 2);
                } else {
                    _ctx.drawImage(drawable, 0, 0, _canvasSize.x, _canvasSize.y);
                }
                const ctxData = _ctx.getImageData(_sx, _sy, _size.x, _size.y).data;
                grayAndHalfSampleFromCanvasData(ctxData, _size, _data);
            } else {
                // Step 3: Scale the grayscale data using bilinear interpolation (matching Node)
                const scaledGrayData = new Uint8Array(_canvasSize.x * _canvasSize.y);
                const stepSizeX = _videoSize.x / _canvasSize.x;
                const stepSizeY = _videoSize.y / _canvasSize.y;
                
                for (let y = 0; y < _canvasSize.y; y++) {
                    for (let x = 0; x < _canvasSize.x; x++) {
                        const srcX = x * stepSizeX;
                        const srcY = y * stepSizeY;
                        scaledGrayData[y * _canvasSize.x + x] = bilinearInterpolate(
                            grayData, 
                            _videoSize.x, 
                            _videoSize.y, 
                            srcX, 
                            srcY
                        ) | 0;
                    }
                }
                
                // Step 4: Crop to target region
                for (let y = 0; y < _size.y; y++) {
                    for (let x = 0; x < _size.x; x++) {
                        const srcIdx = (y + _sy) * _canvasSize.x + (x + _sx);
                        _data[y * _size.x + x] = scaledGrayData[srcIdx];
                    }
                }
            }
            
            return true;
        }
        return false;
    };

    _that.getSize = function () {
        return _size;
    };

    return _that;
};

export default FrameGrabber;
