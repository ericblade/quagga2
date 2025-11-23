import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 39 Decoder Tests', () => {
    const code39TestSet = [
        { 'name': 'image-001.jpg', 'result': 'B3% $DAD$', format: 'code_39' },
        { 'name': 'image-003.jpg', 'result': 'CODE39', format: 'code_39' },
        { 'name': 'image-004.jpg', 'result': 'QUAGGAJS', format: 'code_39' },
        { 'name': 'image-005.jpg', 'result': 'CODE39', format: 'code_39', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-006.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
        { 'name': 'image-007.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
        { 'name': 'image-008.jpg', 'result': 'CODE39', format: 'code_39' },
        { 'name': 'image-009.jpg', 'result': '2/4-8/16-32', format: 'code_39' },
        // TODO: image 10 in this set appears to be dependent upon #191
        { 'name': 'image-010.jpg', 'result': 'CODE39', format: 'code_39' },
        { 'name': 'image-011.jpg', 'result': '4', format: 'code_39', allowFailInNode: true, allowFailInBrowser: true },
    ];
    runDecoderTestBothHalfSample('code_39', (halfSample) => generateConfig({
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['code_39_reader'],
        }
    }), code39TestSet);
});
