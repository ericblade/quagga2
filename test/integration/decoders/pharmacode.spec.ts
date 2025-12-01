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
    // Use locate: false since test images are synthetically generated
    runDecoderTestBothHalfSample('pharmacode', (halfSample) => generateConfig({
        locate: false,
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['pharmacode_reader']
        }
    }), pharmacodeTestSet);
});
