import { expect } from 'chai';
import merge from 'lodash/merge';
import sinon, { SinonSpy } from 'sinon';
import { AreaConfig } from 'common/cvutils/computeImageArea';
import { QuaggaJSConfigObject } from '../../../type-definitions/quagga';
import QuaggaConfig from '../../config/config';
import BarcodeLocator from '../barcode_locator';

if (typeof (globalThis as any).ENV === 'undefined') {
    (globalThis as any).ENV = { production: true, development: false, node: true };
}

describe('Barcode Locator', () => {
    describe('checkImageConstraints', () => {
        let config: QuaggaJSConfigObject;
        let imageSize = { x: 0, y: 0 };
        const streamConfig: { area?: AreaConfig } = {};
        let inputStream = {
            getWidth() {
                return imageSize.x;
            },
            getHeight() {
                return imageSize.y;
            },
            setWidth(width: number) {},
            setHeight(height: number) {},
            setTopRight() {},
            setCanvasSize() {},
            getConfig() {
                return streamConfig;
            },
        };

        beforeEach(() => {
            imageSize = {
                x: 640, y: 480,
            };
            config = merge({}, QuaggaConfig);
            inputStream = {
                getWidth() {
                    return imageSize.x;
                },
                getHeight() {
                    return imageSize.y;
                },
                setWidth() {},
                setHeight() {},
                setTopRight() {},
                setCanvasSize() {},
                getConfig() {
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

        afterEach(() => {
            ((inputStream.setWidth) as SinonSpy).restore();
            ((inputStream.setHeight) as SinonSpy).restore();
        });

        it('should not adjust the image-size if not needed', () => {
            // console.warn('* image size=', JSON.stringify(imageSize));
            const expected = { x: imageSize.x, y: imageSize.y };
            // console.warn('* inputStream before=', inputStream.getWidth(), inputStream.getHeight());
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            // console.warn('* inputStream after=', inputStream.getWidth(), inputStream.getHeight());
            expect(inputStream.getWidth()).to.be.equal(expected.x);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
        });

        it('should adjust the image-size', () => {
            const expected = { x: imageSize.x, y: imageSize.y };

            config.locator!.halfSample = true;
            imageSize.y += 1;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getWidth()).to.be.equal(expected.x);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
        });

        it('should adjust the image-size', () => {
            const expected = { x: imageSize.x, y: imageSize.y };

            imageSize.y += 1;
            config.locator!.halfSample = false;
            BarcodeLocator.checkImageConstraints(inputStream, config.locator);
            expect(inputStream.getHeight()).to.be.equal(expected.y);
            expect(inputStream.getWidth()).to.be.equal(expected.x);
        });

        it('should take the defined area into account', () => {
            const expectedSize = {
                x: 420,
                y: 315,
            };
            const expectedTopRight = {
                x: 115,
                y: 52,
            };
            const expectedCanvasSize = {
                x: 640,
                y: 480,
            };

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

        it('should return the original size if set to full image', () => {
            const expectedSize = {
                x: 640,
                y: 480,
            };
            const expectedTopRight = {
                x: 0,
                y: 0,
            };
            const expectedCanvasSize = {
                x: 640,
                y: 480,
            };

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
