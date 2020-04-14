import { QuaggaJSConfigObject } from "../type-definitions/quagga";
import ImageWrapper from "common/image_wrapper";

export class QuaggaContext {
  constructor(
    public config: QuaggaJSConfigObject
  ) {
  }

  public inputStream: any;

  public framegrabber: any;

  public inputImageWrapper?: ImageWrapper;

  public stopped: boolean = false;

  public boxSize: any;
}