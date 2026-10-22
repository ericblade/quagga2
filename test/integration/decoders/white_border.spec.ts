import { runDecoderTest, generateConfig } from '../helpers';

// upc and ean fixtures centered on the white canvas a 20 degree rotation would need. With
// thresholding: 'global', 2 of the 8 are decoded (6 of 8 are not located). Only halfSample:
// true is tested; with halfSample: false, 'patch' decodes 4 of the 8.
describe('Locator thresholding: patch (white border)', () => {
    const upcSet = [
        { name: 'upc-001.jpg', result: '882428015268', format: 'upc_a' },
        { name: 'upc-003.jpg', result: '882428015084', format: 'upc_a' },
        { name: 'upc-004.jpg', result: '882428015343', format: 'upc_a' },
        { name: 'upc-007.jpg', result: '882428015084', format: 'upc_a' },
        { name: 'upc-009.jpg', result: '039047013551', format: 'upc_a' },
    ];
    const eanSet = [
        { name: 'ean-001.jpg', result: '3574660239843', format: 'ean_13' },
        { name: 'ean-003.jpg', result: '4006209700068', format: 'ean_13' },
        { name: 'ean-006.jpg', result: '4003626011159', format: 'ean_13' },
    ];
    const config = (reader: string) => generateConfig({
        locator: { halfSample: true, thresholding: 'patch' },
        decoder: { readers: [reader] },
    });
    runDecoderTest('upc', config('upc_reader'), upcSet, "halfSample: true, thresholding: 'patch'", 'white_border');
    runDecoderTest('ean', config('ean_reader'), eanSet, "halfSample: true, thresholding: 'patch'", 'white_border');
});
