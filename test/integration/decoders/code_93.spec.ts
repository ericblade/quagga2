import { runDecoderTestBothHalfSample, generateConfig } from '../helpers';

describe('Code 93 Decoder Tests', () => {
    const code93TestSet = [
        { 'name': 'image-001.jpg', 'result': 'WIWV8ETQZ1', format: 'code_93' },
        { 'name': 'image-002.jpg', 'result': 'EH3C-%GU23RK3', format: 'code_93' },
        { 'name': 'image-003.jpg', 'result': 'O308SIHQOXN5SA/PJ', format: 'code_93' },
        { 'name': 'image-004.jpg', 'result': 'DG7Q$TV8JQ/EN', format: 'code_93' },
        { 'name': 'image-005.jpg', 'result': 'DG7Q$TV8JQ/EN', format: 'code_93' },
        { 'name': 'image-006.jpg', 'result': 'O308SIHQOXN5SA/PJ', format: 'code_93' },
        { 'name': 'image-007.jpg', 'result': 'VOFD1DB5A.1F6QU', format: 'code_93' },
        { 'name': 'image-008.jpg', 'result': 'WIWV8ETQZ1', format: 'code_93' },
        { 'name': 'image-009.jpg', 'result': '4SO64P4X8 U4YUU1T-', format: 'code_93' },
        { 'name': 'image-010.jpg', 'result': '4SO64P4X8 U4YUU1T-', format: 'code_93' },
        { 'name': 'image-011.jpg', result: '11169', format: 'code_93' },
    ];
    runDecoderTestBothHalfSample('code_93', (halfSample) => generateConfig({
        inputStream: { size: 800, singleChannel: false },
        locator: {
            patchSize: 'large',
            halfSample,
        },
        decoder: {
            readers: ['code_93_reader'],
        },
    }), code93TestSet);
});
