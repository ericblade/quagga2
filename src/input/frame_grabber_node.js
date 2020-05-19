const CVUtils = require('../common/cv_utils');
const Ndarray = require('ndarray');
const Interp2D = require('ndarray-linear-interpolate').d2;

const FrameGrabber = {};

FrameGrabber.create = function (inputStream) {
    const _that = {};
    const _video_size = CVUtils.imageRef(inputStream.getRealWidth(), inputStream.getRealHeight());
    const _canvasSize = inputStream.getCanvasSize();
    const _size = CVUtils.imageRef(inputStream.getWidth(), inputStream.getHeight());
    const _topRight = inputStream.getTopRight();
    let _data = new Uint8Array(_size.x * _size.y);
    const _grayData = new Uint8Array(_video_size.x * _video_size.y);
    const _canvasData = new Uint8Array(_canvasSize.x * _canvasSize.y);
    /* eslint-disable new-cap */
    const _grayImageArray = Ndarray(_grayData, [_video_size.y, _video_size.x]).transpose(1, 0);
    const _canvasImageArray = Ndarray(_canvasData, [_canvasSize.y, _canvasSize.x]).transpose(1, 0);
    const _targetImageArray = _canvasImageArray
        .hi(_topRight.x + _size.x, _topRight.y + _size.y)
        .lo(_topRight.x, _topRight.y);
    const _stepSizeX = _video_size.x / _canvasSize.x;
    const _stepSizeY = _video_size.y / _canvasSize.y;

    if (ENV.development) {
        console.log('FrameGrabber', JSON.stringify({
            videoSize: _grayImageArray.shape,
            canvasSize: _canvasImageArray.shape,
            stepSize: [_stepSizeX, _stepSizeY],
            size: _targetImageArray.shape,
            topRight: _topRight,
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
        const frame = inputStream.getFrame();

        if (frame) {
            this.scaleAndCrop(frame);
            return true;
        }
        return false;
    };

    // eslint-disable-next-line
    _that.scaleAndCrop = function(frame) {
        // 1. compute full-sized gray image
        CVUtils.computeGray(frame.data, _grayData);

        // 2. interpolate
        for (let y = 0; y < _canvasSize.y; y++) {
            for (let x = 0; x < _canvasSize.x; x++) {
                _canvasImageArray.set(x, y, (Interp2D(_grayImageArray, x * _stepSizeX, y * _stepSizeY)) | 0);
            }
        }

        // targetImageArray must be equal to targetSize
        if (_targetImageArray.shape[0] !== _size.x
            || _targetImageArray.shape[1] !== _size.y) {
            throw new Error('Shapes do not match!');
        }

        // 3. crop
        for (let y = 0; y < _size.y; y++) {
            for (let x = 0; x < _size.x; x++) {
                _data[y * _size.x + x] = _targetImageArray.get(x, y);
            }
        }
    },

    _that.getSize = function () {
        return _size;
    };

    return _that;
};

module.exports = FrameGrabber;
