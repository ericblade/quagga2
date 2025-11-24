import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('UPC-E Decoder Tests', () => {
    const upcETestSet = [
        { 'name': 'image-001.jpg', 'result': '04965802', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-002.jpg', 'result': '04965802', format: 'upc_e' },
        { 'name': 'image-003.jpg', 'result': '03897425', format: 'upc_e' },
        { 'name': 'image-004.jpg', 'result': '05096893', format: 'upc_e' },
        { 'name': 'image-005.jpg', 'result': '05096893', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-006.jpg', 'result': '05096893', format: 'upc_e' },
        { 'name': 'image-007.jpg', 'result': '03897425', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-008.jpg', 'result': '01264904', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-009.jpg', 'result': '01264904', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-010.jpg', 'result': '01264904', format: 'upc_e', allowFailInNode: true, allowFailInBrowser: true },
    ];
    runDecoderTestBothHalfSample('upc_e', (halfSample) => generateConfig({
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['upc_e_reader']
        }
    }), upcETestSet);
});
