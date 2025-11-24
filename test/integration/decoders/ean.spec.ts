import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('EAN Decoder Tests', () => {
    const eanTestSet = [
        { 'name': 'image-001.jpg', 'result': '3574660239843', format: 'ean_13' },
        { 'name': 'image-002.jpg', 'result': '8032754490297', format: 'ean_13' },
        { 'name': 'image-004.jpg', 'result': '9002233139084', format: 'ean_13' },
        { 'name': 'image-003.jpg', 'result': '4006209700068', format: 'ean_13' },
        { 'name': 'image-005.jpg', 'result': '8004030044005', format: 'ean_13' },
        { 'name': 'image-006.jpg', 'result': '4003626011159', format: 'ean_13' },
        { 'name': 'image-007.jpg', 'result': '2111220009686', format: 'ean_13' },
        { 'name': 'image-008.jpg', 'result': '9000275609022', format: 'ean_13' },
        { 'name': 'image-009.jpg', 'result': '9004593978587', format: 'ean_13' },
        { 'name': 'image-010.jpg', 'result': '9002244845578', format: 'ean_13' },
    ];
    runDecoderTestBothHalfSample('ean', (halfSample) => generateConfig({ locator: { halfSample } }), eanTestSet);
});
