import { QuaggaJSConfigObject } from '../../type-definitions/quagga.d';
import DevConfig from './config.dev';
import NodeConfig from './config.node';
import ProdConfig from './config.prod';

const ExportConfig: QuaggaJSConfigObject = (() => {
    let QuaggaConfig: QuaggaJSConfigObject;
    if (typeof ENV === 'undefined' || ENV.development) {
        QuaggaConfig = DevConfig;
    } else if (ENV.node) {
        QuaggaConfig = NodeConfig;
    } else {
        QuaggaConfig = ProdConfig;
    }
    return QuaggaConfig;
})();

export default ExportConfig;
