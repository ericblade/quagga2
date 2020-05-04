if (typeof (globalThis as any).ENV === 'undefined') {
    (globalThis as any).ENV = { production: true, development: false, node: true };
}

import BarcodeLocator from '../barcode_locator';
import QuaggaConfig from '../../config/config';
import {merge} from 'lodash';
import sinon, {SinonSpy} from 'sinon';
import { expect } from 'chai';
import { QuaggaJSConfigObject } from '../../../type-definitions/quagga';

declare interface AreaConfig {
    area: {
        top: string,
        right: string,
        bottom: string,
        left: string,
    }
};

describe('Barcode Locator', () => {

    describe('checkImageConstraints', function() {
        let config: QuaggaJSConfigObject;
        let imageSize = { x: 0, y: 0 };
        let inputStream = {
            getWidth: function() {
                return imageSize.x;
            },
            getHeight: function() {
                return imageSize.y;
            },
            setWidth: function(width: number) {},
            setHeight: function(height: number) {},
            setTopRight: function() {},
            setCanvasSize: function() {},
            getConfig: function() {
                return streamConfig;
            },
        };

        let streamConfig: AreaConfig | {} = { };

        beforeEach(function() {
            imageSize = {
                x: 640, y: 480,
            };
            config = merge({}, QuaggaConfig);
            inputStream = {
                getWidth: function() {
                    return imageSize.x;
                },
                getHeight: function() {
                    return imageSize.y;
                },
                setWidth: function() {},
                setHeight: function() {},
                setTopRight: function() {},
                setCanvasSize: function() {},
                getConfig: function() {
                    return streamConfig;
                },
            };
            sinon.stub(inputStream, 'setWidth').callsFake((width) => {
                imageSize.x = width;
            });
            sinon.stub(inputStream, 'setHeight').callsFake((height) => {
                imageSize.y = height;
            });
            sinon.stub(inputStream, 'setTopRight');
            sinon.stub(inputStream, 'setCanvasSize');
        });

        afterEach(function() {
            ((inputStream.setWidth) as SinonSpy).restore();
            ((inputStream.setHeight) as SinonSpy).restore();
        });

        it('should not adjust the image-size if not needed', function() {
            // console.warn('* image size=', JSON.stringify(imageSize));
            var expected = {x: imageSize.x, y: imageSize.y};
            // console.warn('* inputStream before=', inputStream.getWidth(), inputStream.getHeight());
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            // console.warn('* inputStream after=', inputStream.getWidth(), inputStream.getHeight());
            expect(inputStream.getWidth()).to.be.equal(expected.x);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
        });

        it('should adjust the image-size', function() {
            var expected = {x: imageSize.x, y: imageSize.y};

            config.locator!.halfSample = true;
            imageSize.y += 1;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getWidth()).to.be.equal(expected.x);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
        });

        it('should adjust the image-size', function() {
            var expected = {x: imageSize.x, y: imageSize.y};

            imageSize.y += 1;
            config.locator!.halfSample = false;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
            expect(inputStream.getWidth()).to.be.equal(expected.x);
        });

        it('should take the defined area into account', function() {
            var expectedSize = {
                    x: 420,
                    y: 315,
                },
                expectedTopRight = {
                    x: 115,
                    y: 52,
                },
                expectedCanvasSize = {
                    x: 640,
                    y: 480,
                };

            // @ts-ignore
            streamConfig.area = {
                top: '11%',
                right: '15%',
                bottom: '20%',
                left: '18%',
            };

            config.locator!.halfSample = false;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getHeight()).to.be.equal(expectedSize.y);
            expect(inputStream.getWidth()).to.be.equal(expectedSize.x);
            expect(((inputStream.setTopRight) as SinonSpy).getCall(0).args[0]).to.deep.equal(expectedTopRight);
            expect(((inputStream.setCanvasSize) as SinonSpy).getCall(0).args[0]).to.deep.equal(expectedCanvasSize);
        });

        it('should return the original size if set to full image', function() {
            var expectedSize = {
                    x: 640,
                    y: 480,
                },
                expectedTopRight = {
                    x: 0,
                    y: 0,
                },
                expectedCanvasSize = {
                    x: 640,
                    y: 480,
                };

            // @ts-ignore
            streamConfig.area = {
                top: '0%',
                right: '0%',
                bottom: '0%',
                left: '0%',
            };

            config.locator!.halfSample = false;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getHeight()).to.be.equal(expectedSize.y);
            expect(inputStream.getWidth()).to.be.equal(expectedSize.x);
            expect(((inputStream.setTopRight) as SinonSpy).getCall(0).args[0]).to.deep.equal(expectedTopRight);
            expect(((inputStream.setCanvasSize) as SinonSpy).getCall(0).args[0]).to.deep.equal(expectedCanvasSize);
        });
    });
});
