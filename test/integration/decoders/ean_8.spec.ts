import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('EAN-8 Decoder Tests', () => {
    const ean8TestSet = [
        { 'name': 'image-001.jpg', 'result': '42191605', format: 'ean_8' },
        { 'name': 'image-002.jpg', 'result': '42191605', format: 'ean_8' },
        { 'name': 'image-003.jpg', 'result': '90311208', format: 'ean_8', allowFailInBrowser: true },
        { 'name': 'image-004.jpg', 'result': '24057257', format: 'ean_8' },
        // {"name": "image-005.jpg", "result": "90162602"},
        { 'name': 'image-006.jpg', 'result': '24036153', format: 'ean_8' },
        // {"name": "image-007.jpg", "result": "42176817"},
        { 'name': 'image-008.jpg', 'result': '42191605', format: 'ean_8' },
        { 'name': 'image-009.jpg', 'result': '42242215', format: 'ean_8', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-010.jpg', 'result': '42184799', format: 'ean_8' },
    ];
    runDecoderTestBothHalfSample('ean_8', (halfSample) => generateConfig({
        locator: {
            patchSize: 'large',
            halfSample,
        },
        decoder: {
            readers: ['ean_8_reader']
        }
    }), ean8TestSet);
});
