window.ENV = { development: true, production: false, node: false };

import '../../src/common/test/array_helper.spec.ts';
import '../../src/common/test/area_overlay.spec.ts';
import '../../src/common/test/cv_utils.spec';
import '../../src/common/test/events.spec.ts';
import '../../src/locator/test/barcode_locator.spec.ts';
import '../../src/locator/test/skeletonizer.spec.ts';
import '../../src/quagga/test/transform.spec.ts';
// Tests for Quagga class (transformResult method)
import '../../src/quagga/test/quagga.spec.ts';
import '../../src/common/test/image_wrapper.spec.ts';
// Tests for QuaggaJSStaticInterface (init method)
import '../../src/test/quagga.spec.ts';
