import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 128 Decoder Tests', () => {
    // Note: FNC1 characters are represented as ASCII 29 (Group Separator, \x1D or \u001d)
    // These are used in GS1-128 barcodes as field separators
    const FNC1 = String.fromCharCode(29);
    const code128TestSet = [
        { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-002.jpg', 'result': 'FANAVF14617104', format: 'code_128' },
        { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-004.jpg', 'result': '010210150301625334', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-005.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        { 'name': 'image-006.jpg', 'result': '419055603900009001012999', format: 'code_128' },
        // GS1-128 barcode with FNC1 characters as field separators
        { 'name': 'image-007.jpg', 'result': `${FNC1}42095747${FNC1}9499907123456123456781`, format: 'code_128' },
        { 'name': 'image-008.jpg', 'result': '1020185021797280784055', format: 'code_128' },
        { 'name': 'image-009.jpg', 'result': '0001285112001000040801', format: 'code_128' },
        { 'name': 'image-010.jpg', 'result': '673023', format: 'code_128' },
        // TODO: need to implement having different inputStream parameters to be able to
        // read this one -- it works only with inputStream size set to 1600 presently, but
        // other samples break at that high a size.
        // { name: 'image-011.png', result: '33c64780-a9c0-e92a-820c-fae7011c11e2' },
        // GS1-128 barcodes from issue #390 - real-world food packaging barcodes
        // image-012 works with halfSample: false, but not with halfSample: true
        { 'name': 'image-012.jpg', 'result': '01906641589574681121102531020003402152731515', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        // image-013 and image-014 require higher resolution settings to decode properly
        // According to issue #390, image-013 needs size: 1280, patchSize: 'small'
        // and image-014 needs size: 1600, patchSize: 'large'
        { 'name': 'image-013.jpg', 'result': '', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-014.jpg', 'result': '', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
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
