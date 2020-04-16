import { QuaggaBuildEnvironment, QuaggaJSConfigObject } from "../../type-definitions/quagga";
import * as DevConfig from './config.dev';
import * as NodeConfig from './config.node';
import * as ProdConfig from './config.prod';

declare var ENV: QuaggaBuildEnvironment;

// @ts-ignore // TODO: this produces a bizarre typescript error
const QuaggaConfig: QuaggaJSConfigObject = ENV.development
    ? DevConfig
    : ENV.node
        ? NodeConfig
        : ProdConfig;

export default QuaggaConfig;
