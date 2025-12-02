$(function() {
    var resultCollector = Quagga.ResultCollector.create({
        capture: true,
        capacity: 20,
        blacklist: [{
            code: "WIWV8ETQZ1", format: "code_93"
        }, {
            code: "EH3C-%GU23RK3", format: "code_93"
        }, {
            code: "O308SIHQOXN5SA/PJ", format: "code_93"
        }, {
            code: "DG7Q$TV8JQ/EN", format: "code_93"
        }, {
            code: "VOFD1DB5A.1F6QU", format: "code_93"
        }, {
            code: "4SO64P4X8 U4YUU1T-", format: "code_93"
        }],
        filter: function(codeResult) {
            // only store results which match this constraint
            // e.g.: codeResult
            return true;
        }
    });
    var App = {
        _initDebounceTimer: null,
        _pendingReinit: false,
        init: function() {
            var self = this;
            Quagga.init(this.state, function(err) {
                if (err) {
                    return self.handleError(err);
                }
                //Quagga.registerResultCollector(resultCollector);
                App.attachListeners();
                Quagga.start();
                App.initCameraSelection();
                App.checkCapabilities();
                // Sync UI checkboxes to match actual state after init
                $('input[name="locate"]').prop('checked', App.state.locate);
            });
        },
        reinit: function() {
            // Debounced reinit: cancel pending and schedule a new one
            console.log('[App.reinit] Called, current timer:', App._initDebounceTimer !== null, 'Current state.locate:', App.state.locate);
            if (App._initDebounceTimer) {
                console.log('[App.reinit] Cancelling pending init');
                clearTimeout(App._initDebounceTimer);
            }
            App._initDebounceTimer = setTimeout(function() {
                console.log('[App.reinit] Debounce expired, calling init() with state.locate:', App.state.locate);
                App._initDebounceTimer = null;
                App._pendingReinit = false;
                App.init();
            }, 250);
        },
        handleError: function(err) {
            console.log(err);
            // If we attempted to open a specific device and failed, revert to last known-good constraints
            try {
                var attempted = (App.state && App.state.inputStream && App.state.inputStream.constraints) || {};
                var hadSpecificDevice = attempted && attempted.deviceId;
                if (hadSpecificDevice) {
                    // Detach to avoid stacked handlers
                    // Try reinitializing to restore a working stream
                    Quagga.stop();
                    App.init();
                }
            } catch(e2) {
                // Ignore and leave UI available for user to pick another device
            }
        },
        checkCapabilities: function() {
            var track = Quagga.CameraAccess.getActiveTrack();
            var capabilities = {};
            if (typeof track.getCapabilities === 'function') {
                capabilities = track.getCapabilities();
            }
            this.applySettingsVisibility('zoom', capabilities.zoom);
            this.applySettingsVisibility('torch', capabilities.torch);
        },
        updateOptionsForMediaRange: function(node, range) {
            console.log('updateOptionsForMediaRange', node, range);
            var NUM_STEPS = 6;
            var stepSize = (range.max - range.min) / NUM_STEPS;
            var option;
            var value;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            for (var i = 0; i <= NUM_STEPS; i++) {
                value = range.min + (stepSize * i);
                option = document.createElement('option');
                option.value = value;
                option.innerHTML = value;
                node.appendChild(option);
            }
        },
        applySettingsVisibility: function(setting, capability) {
            // depending on type of capability
            if (typeof capability === 'boolean') {
                var node = document.querySelector('input[name="settings_' + setting + '"]');
                if (node) {
                    node.parentNode.style.display = capability ? 'block' : 'none';
                }
                return;
            }
            if (window.MediaSettingsRange && capability instanceof window.MediaSettingsRange) {
                var node = document.querySelector('select[name="settings_' + setting + '"]');
                if (node) {
                    this.updateOptionsForMediaRange(node, capability);
                    node.parentNode.style.display = 'block';
                }
                return;
            }
        },
        initCameraSelection: function(){
            var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();
            var selectedDeviceId = null;
            try {
                // Prefer explicit deviceId from current state if present
                var constraints = (this.state && this.state.inputStream && this.state.inputStream.constraints) || {};
                if (constraints.deviceId) {
                    selectedDeviceId = (typeof constraints.deviceId === 'object' && constraints.deviceId.exact) ? constraints.deviceId.exact : constraints.deviceId;
                } else {
                    selectedDeviceId = null;
                }
            } catch(e) {}

            return Quagga.CameraAccess.enumerateVideoDevices()
            .then(function(devices) {
                function pruneText(text) {
                    return text.length > 30 ? text.substr(0, 30) : text;
                }
                var $deviceSelection = document.getElementById("deviceSelection");
                while ($deviceSelection.firstChild) {
                    $deviceSelection.removeChild($deviceSelection.firstChild);
                }
                devices.forEach(function(device) {
                    var $option = document.createElement("option");
                    $option.value = device.deviceId || device.id;
                    $option.appendChild(document.createTextNode(pruneText(device.label || device.deviceId || device.id)));
                    // Preserve explicit selection by deviceId when available; fallback to stream label
                    if (selectedDeviceId) {
                        $option.selected = ($option.value === selectedDeviceId);
                    } else {
                        $option.selected = (streamLabel === device.label);
                    }
                    $deviceSelection.appendChild($option);
                });
            });
        },
        attachListeners: function() {
            var self = this;

            console.log('[App.attachListeners] Called - this should only happen once per init');
            self.initCameraSelection();

            // Remove any existing handlers to prevent stacking
            $(".controls").off("click", "button.stop");
            $(".controls .reader-config-group").off("change", "input, select");

            $(".controls").on("click", "button.stop", function(e) {
                e.preventDefault();
                Quagga.stop();
                self._printCollectedResults();
            });

            $(".controls .reader-config-group").on("change", "input, select", function(e) {
                e.preventDefault();
                var $target = $(e.target),
                    value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                    name = $target.attr("name"),
                    state = self._convertNameToState(name);

                console.log("Value of "+ state + " changed to " + value, "checkbox checked prop:", $target.prop("checked"), "target type:", $target.attr("type"));
                self.setState(state, value);
            });
        },
        _printCollectedResults: function() {
            var results = resultCollector.getResults(),
                $ul = $("#result_strip ul.collector");

            results.forEach(function(result) {
                var $li = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');

                $li.find("img").attr("src", result.frame);
                $li.find("h4.code").html(result.codeResult.code + " (" + result.codeResult.format + ")");
                $ul.prepend($li);
            });
        },
        _accessByPath: function(obj, path, val) {
            var parts = path.split('.'),
                depth = parts.length,
                setter = (typeof val !== "undefined") ? true : false;

            return parts.reduce(function(o, key, i) {
                if (setter && (i + 1) === depth) {
                    if (typeof o[key] === "object" && typeof val === "object") {
                        Object.assign(o[key], val);
                    } else {
                        o[key] = val;
                    }
                }
                return key in o ? o[key] : {};
            }, obj);
        },
        _convertNameToState: function(name) {
            return name.replace("_", ".").split("-").reduce(function(result, value) {
                return result + value.charAt(0).toUpperCase() + value.substring(1);
            });
        },
        detachListeners: function() {
            $(".controls").off("click", "button.stop");
            $(".controls .reader-config-group").off("change", "input, select");
        },
        applySetting: function(setting, value) {
            var track = Quagga.CameraAccess.getActiveTrack();
            if (track && typeof track.getCapabilities === 'function') {
                switch (setting) {
                case 'zoom':
                    return track.applyConstraints({advanced: [{zoom: parseFloat(value)}]});
                case 'torch':
                    return track.applyConstraints({advanced: [{torch: !!value}]});
                }
            }
        },
        setState: function(path, value) {
            var self = this;

            console.log('[App.setState] ENTRY: path=', path, 'value=', value, 'current state.locate=', self.state.locate);

            if (typeof self._accessByPath(self.inputMapper, path) === "function") {
                value = self._accessByPath(self.inputMapper, path)(value);
            }

            if (path.startsWith('settings.')) {
                var setting = path.substring(9);
                return self.applySetting(setting, value);
            }
            // If switching cameras, replace constraints entirely with { deviceId: { exact } }
            if (path === 'inputStream.constraints' && value && typeof value === 'object' && 'deviceId' in value && Object.keys(value).length === 1) {
                if (!self.state.inputStream) self.state.inputStream = {};
                var dev = value.deviceId;
                self.state.inputStream.constraints = { deviceId: (typeof dev === 'object' ? dev : { exact: dev }) };
            } else {
                self._accessByPath(self.state, path, value);
            }

            console.log('[App.setState] AFTER _accessByPath: state.locate=', self.state.locate);
            console.log(JSON.stringify(self.state));

            console.log('[App.setState] path:', path, 'pending:', App._pendingReinit);
            // Prevent overlapping stop/reinit sequences
            if (App._pendingReinit) {
                // Already stopping/reiniting, just update the debounce timer
                console.log('[App.setState] Already pending, just updating debounce');
                App.reinit();
                return;
            }

            console.log('[App.setState] Calling stop and scheduling reinit');
            App._pendingReinit = true;
            App.detachListeners();
            var stopResult = Quagga.stop();
            if (stopResult && typeof stopResult.then === 'function') {
                stopResult.then(function(){
                    console.log('[App.setState] Stop completed (promise), calling reinit');
                    App.reinit();
                });
            } else {
                // Older sync stop; reinit with debounce
                console.log('[App.setState] Stop completed (sync), calling reinit');
                App.reinit();
            }
        },
        inputMapper: {
            inputStream: {
                constraints: function(value){
                    if (/^(\d+)x(\d+)$/.test(value)) {
                        var values = value.split('x');
                        // Update resolution while preserving any existing deviceId selection
                        var current = App.state && App.state.inputStream && App.state.inputStream.constraints || {};
                        var next = {
                            width: {min: parseInt(values[0])},
                            height: {min: parseInt(values[1])}
                        };
                        if (current.deviceId) {
                            next.deviceId = current.deviceId;
                        }
                        return next;
                    }
                    // Switching camera: use ONLY deviceId with exact match to avoid conflicting constraints
                    return { deviceId: { exact: value } };
                }
            },
            decoder: {
                readers: function(value) {
                    if (value === 'ean_extended') {
                        return [{
                            format: "ean_reader",
                            config: {
                                supplements: [
                                    'ean_5_reader', 'ean_2_reader'
                                ]
                            }
                        }];
                    }
                    return [{
                        format: value + "_reader",
                        config: {}
                    }];
                }
            }
        },
        state: {
            inputStream: {
                type : "LiveStream",
                constraints: {
                    width: {min: 640},
                    height: {min: 480},
                    facingMode: "environment",
                    aspectRatio: {min: 1, max: 2}
                },
                area: {
                    top: "30%",
                    right: "10%",
                    left: "10%",
                    bottom: "30%",
                    // borderColor: "#0F0",
                    // borderWidth: 2,
                    backgroundColor: "rgba(255,0,0,0.15)"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            frequency: 10,
            decoder: {
                readers : [{
                    format: "code_128_reader",
                    config: {}
                }]
            },
            locate: true
        },
        lastResult : null
    };

    console.log('[Startup] Calling initial App.reinit()');
    App.reinit();

    var processedCount = 0;
    Quagga.onProcessed(function(result) {
        processedCount++;
        /*
        console.log('onProcessed #' + processedCount + ':', result ? {
            hasBox: !!result.box,
            boxLength: result.box ? result.box.length : 0,
            hasBoxes: !!result.boxes,
            boxesLength: result.boxes ? result.boxes.length : 0,
            codeResult: !!result.codeResult
        } : 'null result');
*/
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "orange", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
    });

    Quagga.onDetected(function(result) {
        var code = result.codeResult.code;

        if (App.lastResult !== code) {
            App.lastResult = code;
            var $node = null, canvas = Quagga.canvas.dom.image;

            $node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');
            $node.find("img").attr("src", canvas.toDataURL());
            $node.find("h4.code").html(code);
            $("#result_strip ul.thumbnails").prepend($node);
        }
    });

});
