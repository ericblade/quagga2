import { QuaggaJSConfigObject } from "../type-definitions/quagga";

export class QuaggaContext {
  constructor(
    public config: QuaggaJSConfigObject
  ) {
  }

  public inputStream: any;
}