// NOTE FOR ANYONE IN HERE IN THE FUTURE:
// webpack.config.js replaces the frame_grabber module with THIS module when it is building for a Browser environment.

import computeGray from '../common/cvutils/computeGray';
import grayAndHalfSampleFromCanvasData from '../common/cvutils/grayAndHalfSampleFromCanvasData';
import imageRef from '../common/cvutils/imageRef';

const TO_RADIANS = Math.PI / 180;

function adjustCanvasSize(canvas, targetSize) {
    if (canvas.width !== targetSize.x) {
        if (ENV.development) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        canvas.width = targetSize.x;
    }
    if (canvas.height !== targetSize.y) {
        if (ENV.development) {
            console.log('WARNING: canvas-size needs to be adjusted');
        }
        canvas.height = targetSize.y;
    }
}

const FrameGrabber = {};

FrameGrabber.create = function (inputStream, canvas) {
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

    _canvas = canvas || document.createElement('canvas');
    _canvas.width = _canvasSize.x;
    _canvas.height = _canvasSize.y;
    _ctx = _canvas.getContext('2d');
    _data = new Uint8Array(_size.x * _size.y);
    if (ENV.development) {
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

    /**
     * Fetches a frame from the input-stream and puts into the frame-buffer.
     * The image-data is converted to gray-scale and then half-sampled if configured.
     */
    _that.grab = function () {
        const doHalfSample = _streamConfig.halfSample;
        const frame = inputStream.getFrame();
        let drawable = frame;
        let drawAngle = 0;
        let ctxData;
        if (drawable) {
            adjustCanvasSize(_canvas, _canvasSize);
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

            if (drawAngle !== 0) {
                _ctx.translate(_canvasSize.x / 2, _canvasSize.y / 2);
                _ctx.rotate(drawAngle);
                _ctx.drawImage(drawable, -_canvasSize.y / 2, -_canvasSize.x / 2, _canvasSize.y, _canvasSize.x);
                _ctx.rotate(-drawAngle);
                _ctx.translate(-_canvasSize.x / 2, -_canvasSize.y / 2);
            } else {
                _ctx.drawImage(drawable, 0, 0, _canvasSize.x, _canvasSize.y);
            }

            ctxData = _ctx.getImageData(_sx, _sy, _size.x, _size.y).data;
            if (doHalfSample) {
                grayAndHalfSampleFromCanvasData(ctxData, _size, _data);
            } else {
                computeGray(ctxData, _data, _streamConfig);
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
