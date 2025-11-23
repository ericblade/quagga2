import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 32 Decoder Tests', () => {
    const code32TestSet = [
        { name: 'image-1.jpg', result: 'A123456788', format: 'code_32_reader' },
        { name: 'image-2.jpg', result: 'A931028462', format: 'code_32_reader', allowFailInNode: true },
        { name: 'image-3.jpg', result: 'A931028462', format: 'code_32_reader', allowFailInNode: true },
        { name: 'image-4.jpg', result: 'A935776043', format: 'code_32_reader' },
        { name: 'image-5.jpg', result: 'A935776043', format: 'code_32_reader' },
        { name: 'image-6.jpg', result: 'A012745182', format: 'code_32_reader', allowFailInNode: true, allowFailInBrowser: true },
        { name: 'image-7.jpg', result: 'A029651039', format: 'code_32_reader', allowFailInNode: true },
        { name: 'image-8.jpg', result: 'A029651039', format: 'code_32_reader', allowFailInNode: true },
        { name: 'image-9.jpg', result: 'A015896018', format: 'code_32_reader' },
        { name: 'image-10.jpg', result: 'A015896018', format: 'code_32_reader' },
    ];
    runDecoderTestBothHalfSample('code_32', (halfSample) => generateConfig({
        inputStream: {
            size: 1280,
        },
        locator: {
            patchSize: 'large',
            halfSample,
        },
        numOfWorkers: 4,
        decoder: {
            readers: ['code_32_reader']
        }
    }), code32TestSet);
});
