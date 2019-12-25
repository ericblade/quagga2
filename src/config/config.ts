import { QuaggaBuildEnvironment, QuaggaJSConfigObject } from "../../type-definitions/quagga";
import * as DevConfig from './config.dev';
import * as NodeConfig from './config.node';
import * as ProdConfig from './config.prod';

declare var ENV: QuaggaBuildEnvironment;

const QuaggaConfig: QuaggaJSConfigObject = ENV.development
    ? DevConfig
    : ENV.node
        ? NodeConfig
        : ProdConfig;

console.warn('* QuaggaConfig=', JSON.stringify(QuaggaConfig));

export default QuaggaConfig;
