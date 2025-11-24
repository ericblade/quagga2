import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('EAN Extended Decoder Tests', () => {
    // TODO: note that the FORMAT reported from a supplement equals the parent. What exactly is the
    // difference between a supplement and a separate reader?  is it just semantic?
    const eanExtendedTestSet = [
        { 'name': 'image-001.jpg', 'result': '900437801102701', format: 'ean_13', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-002.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-003.jpg', 'result': '419871600890101', format: 'ean_13', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-004.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-005.jpg', 'result': '419664190890712', format: 'ean_13', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-006.jpg', 'result': '412056690699101', format: 'ean_13', allowFailInNode: true, allowFailInBrowser: true },
        { 'name': 'image-007.jpg', 'result': '419204531290601', format: 'ean_13' },
        { 'name': 'image-008.jpg', 'result': '419871600890101', format: 'ean_13' },
        { 'name': 'image-009.jpg', 'result': '978054466825652495', format: 'ean_13' },
        { 'name': 'image-010.jpg', 'result': '900437801102701', format: 'ean_13' },
    ];
    runDecoderTestBothHalfSample('ean_extended', (halfSample) => generateConfig({
        inputStream: {
            size: 800,
            singleChannel: false,
        },
        locator: {
            halfSample,
        },
        decoder: {
            readers: [{
                format: 'ean_reader',
                config: {
                    supplements: [
                        'ean_5_reader',
                        'ean_2_reader',
                    ],
                },
            }],
        },
    }), eanExtendedTestSet);
});
