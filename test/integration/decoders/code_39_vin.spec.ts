import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 39 VIN Decoder Tests', () => {
    const code39VinTestSet = [
        { name: 'image-001.jpg', result: '2HGFG1B86BH501831', format: 'code_39_vin' },
        { name: 'image-002.jpg', result: 'JTDKB20U887718156', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        // image-003 only works on the second run of a decode of it and only in browser?! wtf?
        { name: 'image-003.jpg', result: 'JM1BK32G071773697', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-004.jpg', result: 'WDBTK75G94T028954', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-005.jpg', result: '3VW2K7AJ9EM381173', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-006.jpg', result: 'JM1BL1H4XA1335663', format: 'code_39_vin' },
        { name: 'image-007.jpg', result: 'JHMGE8H42AS021233', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-008.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-009.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true }, //yes, 8 and 9 are same barcodes, different images slightly
        { name: 'image-010.jpg', result: 'WMEEJ3BA4DK652562', format: 'code_39_vin', allowFailInNode: true, allowFailInBrowser: true }, // 10 also
        { name: 'image-011.jpg', result: '5FNRL38488B411196', format: 'code_39_vin' },
    ];
    runDecoderTestBothHalfSample('code_39_vin', (halfSample) => generateConfig({
        inputStream: {
            size: 1280,
            sequence: false,
        },
        locator: {
            halfSample,
        },
        decoder: {
            readers: ['code_39_vin_reader'],
        },
    }), code39VinTestSet);
});
