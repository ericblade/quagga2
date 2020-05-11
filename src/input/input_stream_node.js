const GetPixels = require('get-pixels');

var InputStream = {};

InputStream.createImageStream = function() {
    const that = {};
    let _config = null;

    let width = 0;
    let height = 0;
    let loaded = false;
    let frame = null;
    let baseUrl;
    let ended = false;
    let calculatedWidth;
    let calculatedHeight;
    const _eventNames = ['canrecord', 'ended'];
    const _eventHandlers = {};
    const _topRight = {x: 0, y: 0};
    const _canvasSize = {x: 0, y: 0};
    /* eslint-disable no-unused-vars */ // false eslint errors? weird.
    let size = 0;
    let frameIdx = 0;
    let paused = false;
    /* eslint-enable no-unused-vars */

    function loadImages() {
        loaded = false;
        /* eslint-disable new-cap */
        GetPixels(baseUrl, _config.mime, function(err, pixels) {
            if (err) {
                console.error('**** quagga loadImages error:', err);
                throw new Error('error decoding pixels in loadImages');
            }
            loaded = true;
            if (ENV.development) {
                console.log('* InputStreamNode pixels.shape', pixels.shape);
            }
            frame = pixels;
            width = pixels.shape[0];
            height = pixels.shape[1];
            calculatedWidth = _config.size ?
                width / height > 1 ?
                    _config.size
                    : Math.floor((width / height) * _config.size)
                : width;
            calculatedHeight = _config.size ?
                width / height > 1 ?
                    Math.floor((height / width) * _config.size)
                    : _config.size
                : height;

            _canvasSize.x = calculatedWidth;
            _canvasSize.y = calculatedHeight;

            setTimeout(function() {
                publishEvent('canrecord', []);
            }, 0);
        });
    }

    function publishEvent(eventName, args) {
        var j,
            handlers = _eventHandlers[eventName];

        if (handlers && handlers.length > 0) {
            for ( j = 0; j < handlers.length; j++) {
                handlers[j].apply(that, args);
            }
        }
    }


    that.trigger = publishEvent;

    that.getWidth = function() {
        return calculatedWidth;
    };

    that.getHeight = function() {
        return calculatedHeight;
    };

    that.setWidth = function(w) {
        calculatedWidth = w;
    };

    that.setHeight = function(h) {
        calculatedHeight = h;
    };

    that.getRealWidth = function() {
        return width;
    };

    that.getRealHeight = function() {
        return height;
    };

    that.setInputStream = function(stream) {
        _config = stream;
        baseUrl = _config.src;
        size = 1;
        loadImages();
    };

    that.ended = function() {
        return ended;
    };

    that.setAttribute = function() {};

    that.getConfig = function() {
        return _config;
    };

    that.pause = function() {
        paused = true;
    };

    that.play = function() {
        paused = false;
    };

    that.setCurrentTime = function(time) {
        frameIdx = time;
    };

    that.addEventListener = function(event, f) {
        if (_eventNames.indexOf(event) !== -1) {
            if (!_eventHandlers[event]) {
                _eventHandlers[event] = [];
            }
            _eventHandlers[event].push(f);
        }
    };

    that.setTopRight = function(topRight) {
        _topRight.x = topRight.x;
        _topRight.y = topRight.y;
    };

    that.getTopRight = function() {
        return _topRight;
    };

    that.setCanvasSize = function(sz) {
        _canvasSize.x = sz.x;
        _canvasSize.y = sz.y;
    };

    that.getCanvasSize = function() {
        return _canvasSize;
    };

    that.getFrame = function() {
        if (!loaded){
            return null;
        }
        return frame;
    };

    return that;
};

module.exports = InputStream;
