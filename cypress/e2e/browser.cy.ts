window.ENV = { development: true, production: false, node: false };

import '../../src/analytics/test/browser/result_collector.spec.ts';
import '../../src/input/test/browser/camera_access.spec.ts';
import '../../src/input/test/browser/exif_helper.spec';
import '../../src/input/test/browser/image_loader.spec.ts';
import '../../src/common/test/browser/mediaDevices.spec.ts';
