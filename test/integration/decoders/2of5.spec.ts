import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('2 of 5 Decoder Tests', () => {
    const twoOf5TestSet = [
        { 'name': 'image-001.jpg', 'result': '9577149002', format: '2of5' },
        { 'name': 'image-002.jpg', 'result': '9577149002', format: '2of5' },
        { 'name': 'image-003.jpg', 'result': '5776158811', format: '2of5' },
        { 'name': 'image-004.jpg', 'result': '0463381455', format: '2of5' },
        { 'name': 'image-005.jpg', 'result': '3261594101', format: '2of5', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-006.jpg', 'result': '3261594101', format: '2of5', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-007.jpg', 'result': '3261594101', format: '2of5' },
        { 'name': 'image-008.jpg', 'result': '6730705801', format: '2of5' },
        { 'name': 'image-009.jpg', 'result': '5776158811', format: '2of5' },
        { 'name': 'image-010.jpg', 'result': '5776158811', format: '2of5' },
    ];
    runDecoderTestBothHalfSample('2of5', (halfSample) => generateConfig({
        inputStream: { size: 800, singleChannel: false },
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['2of5_reader'],
        },
    }), twoOf5TestSet);
});
