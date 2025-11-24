import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('UPC-A Decoder Tests', () => {
    const upcTestSet = [
        { 'name': 'image-001.jpg', 'result': '882428015268', format: 'upc_a' },
        { 'name': 'image-002.jpg', 'result': '882428015268', format: 'upc_a' },
        { 'name': 'image-003.jpg', 'result': '882428015084', format: 'upc_a' },
        { 'name': 'image-004.jpg', 'result': '882428015343', format: 'upc_a' },
        { 'name': 'image-005.jpg', 'result': '882428015343', format: 'upc_a' },
        { 'name': 'image-006.jpg', 'result': '882428015046', format: 'upc_a', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-007.jpg', 'result': '882428015084', format: 'upc_a' },
        { 'name': 'image-008.jpg', 'result': '882428015046', format: 'upc_a' },
        { 'name': 'image-009.jpg', 'result': '039047013551', format: 'upc_a' },
        { 'name': 'image-010.jpg', 'result': '039047013551', format: 'upc_a', allowFailInNode: true, allowFailInBrowser: true },
    ];
    runDecoderTestBothHalfSample('upc', (halfSample) => generateConfig({
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['upc_reader']
        }
    }), upcTestSet);
});
