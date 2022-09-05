import { QuaggaJSConfigObject } from '../../type-definitions/quagga.d';
import DevConfig from './config.dev';
import NodeConfig from './config.node';
import ProdConfig from './config.prod';

// @ts-ignore // TODO: this produces a bizarre typescript error
// eslint-disable-next-line no-nested-ternary

const QuaggaConfig: QuaggaJSConfigObject = typeof ENV === 'undefined' ? DevConfig :
    ENV.development ? DevConfig :
        ENV.node ? NodeConfig :
            ProdConfig;

export default QuaggaConfig;
