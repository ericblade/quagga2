import { QuaggaJSConfigObject } from '../../type-definitions/quagga.d';

const DevConfig: QuaggaJSConfigObject = {
    inputStream: {
        type: 'LiveStream',
        constraints: {
            width: 640,
            height: 480,
            // aspectRatio: 640/480, // optional
            facingMode: 'environment', // or user
            // deviceId: "38745983457387598375983759834"
        },
        area: {
            top: '0%',
            right: '0%',
            left: '0%',
            bottom: '0%',
        },
        singleChannel: false, // true: only the red color-channel is read
        showArea: false, // draws area boundaries on overlay when area is defined
        areaColor: 'rgba(0, 255, 0, 0.5)', // color of the area border
        areaLineWidth: 2, // line width of the area border
        debug: {
            showImageDetails: false, // logs frame grabber info, canvas size adjustments
        },
    },
    locate: true,
    canvas: {
        createOverlay: true, // set to false to skip creating overlay canvas (drawingBuffer)
    },
    decoder: {
        readers: [
            'code_128_reader',
        ],
        debug: {
            drawBoundingBox: false,
            showFrequency: false,
            drawScanline: false,
            showPattern: false,
            printReaderInfo: false, // logs reader registration and initialization
        },
    },
    locator: {
        halfSample: true,
        patchSize: 'medium', // x-small, small, medium, large, x-large
        debug: {
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showPatchLabels: false,
            showRemainingPatchLabels: false,
            showPatchSize: false, // logs calculated patch size
            showImageDetails: false, // logs image wrapper size, canvas details
            boxFromPatches: {
                showTransformed: false,
                showTransformedBox: false,
                showBB: false,
            },
        },
    },
};

export default DevConfig;
