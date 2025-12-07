import { runDecoderTestBothHalfSample, runNoCodeTest, generateConfig } from '../helpers';

describe('Pharmacode Decoder Tests', () => {
    // Synthetic test images with known values
    // Note: Tests only run with halfSample: false currently work reliably
    // halfSample: true causes bar width detection issues for some images
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

    const pharmacodeRealWorldPositiveTestSet = [
        { 'name': 'image-013.png', 'result': '123456', format: 'pharmacode' },
        // image-014 is two-track pharmacode, not supported at the moment -- maybe not ever depending on difficulty level
        // { 'name': 'image-014.png', 'result': '123456', format: 'pharmacode' },
    ];

    // image-018 requires a constrained scan window to avoid false positives elsewhere in the frame
    // still working out how to fix the false positive from the "orange and white" barcode.
    const pharmacodeRealWorldAreaConstrainedTestSet = [
        { 'name': 'image-018.png', 'result': '123456', format: 'pharmacode' },
    ];

    // Images intentionally expected to decode nothing (should succeed with empty result)
    const pharmacodeRealWorldNoCodeTestSet = [
        { 'name': 'image-015.png', 'result': '', format: 'pharmacode' },
        { 'name': 'image-016.png', 'result': '', format: 'pharmacode' },
        { 'name': 'image-017.png', 'result': '', format: 'pharmacode' },
    ];

    // Use locate: false since test images are synthetically generated and pre-cropped to contain only the barcode (location detection not required)
    runDecoderTestBothHalfSample('pharmacode set 1', (halfSample) => generateConfig({
        locate: false,
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeTestSet, 'pharmacode');

    runDecoderTestBothHalfSample('pharmacode set 2', (halfSample) => generateConfig({
        locate: false,
        inputStream: {
            size: 800,
        },
        locator: {
            halfSample,
            patchSize: 'large',
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeRealWorldPositiveTestSet, 'pharmacode');

    // Dedicated run for image-018 with a narrowed search area (bottom 50%) - top 50% has an unreadable code
    runDecoderTestBothHalfSample('pharmacode area constrained', (halfSample) => generateConfig({
        locate: false,
        inputStream: {
            size: 800,
            area: {
                top: '50%',
            },
        },
        locator: {
            halfSample,
            patchSize: 'large',
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeRealWorldAreaConstrainedTestSet, 'pharmacode');

    // Explicitly validate that certain images decode to nothing (empty barcodes array)
    [true, false].forEach((halfSample) => {
        runNoCodeTest(`pharmacode SHOULD NOT DECODE halfSample:${halfSample}`, generateConfig({
            locate: false,
            inputStream: {
                size: 800,
            },
            locator: {
                halfSample,
                patchSize: 'large',
            },
            decoder: {
                readers: ['pharmacode_reader']
            }
        }), pharmacodeRealWorldNoCodeTestSet, 'pharmacode');
    });
});
