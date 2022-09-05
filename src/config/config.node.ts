import { QuaggaJSConfigObject } from '../../type-definitions/quagga.d';
import { PatchSize } from '../common/cvutils/calculatePatchSize';

const NodeConfig: QuaggaJSConfigObject = {
    inputStream: {
        type: 'ImageStream',
        sequence: false,
        size: 800,
        area: {
            top: '0%',
            right: '0%',
            left: '0%',
            bottom: '0%',
        },
        singleChannel: false, // true: only the red color-channel is read
    },
    locate: true,
    decoder: {
        readers: [
            'code_128_reader',
        ],
    },
    locator: {
        halfSample: true,
        patchSize: PatchSize.medium, // x-small, small, medium, large, x-large
    },
};

export default NodeConfig;
