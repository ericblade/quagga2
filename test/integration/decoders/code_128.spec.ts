import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 128 Decoder Tests', () => {
    const code128TestSet = [
        { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-002.jpg', 'result': 'FANAVF14617104', format: 'code_128' },
        { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-004.jpg', 'result': '010210150301625334', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-005.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        { 'name': 'image-006.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        { 'name': 'image-007.jpg', 'result': '420957479499907123456123456781', format: 'code_128' },
        { 'name': 'image-008.jpg', 'result': '1020185021797280784055', format: 'code_128' },
        { 'name': 'image-009.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-010.jpg', 'result': '673023', format: 'code_128' },
        // TODO: need to implement having different inputStream parameters to be able to
        // read this one -- it works only with inputStream size set to 1600 presently, but
        // other samples break at that high a size.
        // { name: 'image-011.png', result: '33c64780-a9c0-e92a-820c-fae7011c11e2' },
    ];
    runDecoderTestBothHalfSample('code_128', (halfSample) => generateConfig({
        inputStream: {
            size: 800,
            singleChannel: false,
        },
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['code_128_reader'],
        },
    }), code128TestSet);
});
