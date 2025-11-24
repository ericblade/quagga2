import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Codabar Decoder Tests', () => {
    const codabarTestSet = [
        { 'name': 'image-001.jpg', 'result': 'A10/53+17-70D', format: 'codabar' },
        { 'name': 'image-002.jpg', 'result': 'B546745735B', format: 'codabar' },
        { 'name': 'image-003.jpg', 'result': 'C$399.95A', format: 'codabar' },
        { 'name': 'image-004.jpg', 'result': 'B546745735B', format: 'codabar' },
        { 'name': 'image-005.jpg', 'result': 'C$399.95A', format: 'codabar' },
        { 'name': 'image-006.jpg', 'result': 'B546745735B', format: 'codabar' },
        { 'name': 'image-007.jpg', 'result': 'C$399.95A', format: 'codabar' },
        { 'name': 'image-008.jpg', 'result': 'A16:9/4:3/3:2D', format: 'codabar', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-009.jpg', 'result': 'C$399.95A', format: 'codabar' },
        { 'name': 'image-010.jpg', 'result': 'C$399.95A', format: 'codabar' },
    ];
    runDecoderTestBothHalfSample('codabar', (halfSample) => generateConfig({
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['codabar_reader']
        }
    }), codabarTestSet);
});
