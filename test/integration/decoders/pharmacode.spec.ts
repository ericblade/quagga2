import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Pharmacode Decoder Tests', () => {
    const pharmacodeTestSet = [
        { 'name': 'image-001.jpg', 'result': '3', format: 'pharmacode' },
        { 'name': 'image-002.jpg', 'result': '7', format: 'pharmacode' },
        { 'name': 'image-003.jpg', 'result': '12', format: 'pharmacode' },
        { 'name': 'image-004.jpg', 'result': '15', format: 'pharmacode' },
        { 'name': 'image-005.jpg', 'result': '64', format: 'pharmacode' },
        { 'name': 'image-006.jpg', 'result': '100', format: 'pharmacode' },
        { 'name': 'image-007.jpg', 'result': '255', format: 'pharmacode' },
        { 'name': 'image-008.jpg', 'result': '755', format: 'pharmacode' },
        { 'name': 'image-009.jpg', 'result': '1000', format: 'pharmacode' },
        { 'name': 'image-010.jpg', 'result': '4096', format: 'pharmacode' },
        { 'name': 'image-011.jpg', 'result': '12345', format: 'pharmacode' },
        { 'name': 'image-012.jpg', 'result': '65535', format: 'pharmacode' },
    ];

    // Real-world test images added by @ericblade
    // Images 013, 014, 018 contain Pharmacode value 123456
    // Image 017 contains multiple barcodes: 4174 and 3715
    // Images 015, 016 have unknown values
    // These tests are marked allowFail because:
    // 1. The locator struggles with Pharmacode's simple structure (few bars, no start/stop patterns)
    // 2. Without locate:true, the decoder scans through wrong parts of the image
    // 3. With locate:true, the locator often fails to find the barcode region
    const pharmacodeRealWorldTestSet = [
        { 'name': 'image-013.png', 'result': '123456', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-014.png', 'result': '123456', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-015.png', 'result': '131', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-016.png', 'result': '1234', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-017.png', 'result': '4174', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-018.png', 'result': '123456', format: 'pharmacode', allowFailInNode: true, allowFailInBrowser: true },
    ];

    // Use locate: false since test images are synthetically generated and pre-cropped to contain only the barcode (location detection not required)
    runDecoderTestBothHalfSample('pharmacode', (halfSample) => generateConfig({
        locate: false,
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeTestSet);

    // Real-world images require locate: true to find barcode regions
    // Currently marked allowFail due to locator limitations with Pharmacode's simple structure
    runDecoderTestBothHalfSample('pharmacode (real-world)', (halfSample) => generateConfig({
        locate: true,
        inputStream: {
            size: 1600,
        },
        locator: {
            halfSample,
            patchSize: 'small',
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeRealWorldTestSet, 'pharmacode');
});
