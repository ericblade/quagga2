import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Interleaved 2 of 5 Decoder Tests', () => {
    const i2of5TestSet = [
        { 'name': 'image-001.jpg', 'result': '2167361334', format: 'i2of5' },
        { 'name': 'image-002.jpg', 'result': '2167361334', format: 'i2of5' },
        { 'name': 'image-003.jpg', 'result': '2167361334', format: 'i2of5' },
        { 'name': 'image-004.jpg', 'result': '2167361334', format: 'i2of5' },
        { 'name': 'image-005.jpg', 'result': '2167361334', format: 'i2of5' },
    ];
    runDecoderTestBothHalfSample('i2of5', (halfSample) => generateConfig({
        inputStream: { size: 800, singleChannel: false },
        locator: {
            patchSize: 'small',
            halfSample,
        },
        decoder: {
            readers: ['i2of5_reader'],
        },
    }), i2of5TestSet);
});
