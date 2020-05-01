import { QuaggaBuildEnvironment, QuaggaJSConfigObject } from "../../type-definitions/quagga";
import DevConfig from './config.dev';
import NodeConfig from './config.node';
import ProdConfig from './config.prod';

declare var ENV: QuaggaBuildEnvironment;

const QuaggaConfig: QuaggaJSConfigObject = ENV.development
    ? DevConfig
    : ENV.node
        ? NodeConfig
        : ProdConfig;

export default QuaggaConfig;
