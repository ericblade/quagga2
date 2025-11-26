import { describe, it } from 'mocha';
import { expect } from 'chai';
import ImageLoader, { generateImageFilename } from '../../image_loader';

describe('generateImageFilename', () => {
    it('should pad numbers to 3 digits', () => {
        expect(generateImageFilename('/images/', 1)).to.equal('/images/image-001.jpg');
        expect(generateImageFilename('/images/', 42)).to.equal('/images/image-042.jpg');
        expect(generateImageFilename('/images/', 999)).to.equal('/images/image-999.jpg');
    });
    it('should not truncate large numbers', () => {
        expect(generateImageFilename('/images/', 9931)).to.equal('/images/image-9931.jpg');
    });
});

describe('ImageLoader (browser)', () => {
    it('should load a regular image by URL', (done) => {
        const imgUrl = '../../../../test/fixtures/code_128/image-001.jpg';
        ImageLoader.load(imgUrl, (images: Array<{ img: HTMLImageElement }>) => {
            expect(images).to.have.lengthOf(1);
            const img = images[0].img;
            expect(img).to.be.instanceOf(Image);
            expect(img.complete).to.be.true;
            expect(img.naturalWidth).to.be.greaterThan(0);
            done();
        }, 0, 1, false, {});
    });

    it('should load an image with spaces in the filename', (done) => {
        const imgUrl = '../../../../test/fixtures/test image with spaces.jpg';
        ImageLoader.load(imgUrl, (images: Array<{ img: HTMLImageElement }>) => {
            expect(images).to.have.lengthOf(1);
            const img = images[0]?.img;
            expect(img).to.be.instanceOf(Image);
            expect(img.complete).to.be.true;
            expect(img.naturalWidth).to.be.greaterThan(0);
            done();
        }, 0, 1, false, {});
    });

    it('should handle load errors gracefully', (done) => {
        const badUrl = '../../../../test/fixtures/does-not-exist.jpg';
        ImageLoader.load(badUrl, (images: Array<{ img: HTMLImageElement }>) => {
            expect(images).to.have.lengthOf(1);
            const img = images[0]?.img;
            expect(img).to.be.instanceOf(Image);
            expect(img.complete).to.be.true;
            expect(img.naturalWidth).to.equal(0); // Should be 0 for failed load
            done();
        }, 0, 1, false, {});
    });

    it('should load an image via Blob URL', (done) => {
        // Valid 1x1 PNG image
        const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wIAAgMBApUeD5cAAAAASUVORK5CYII=";
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        ImageLoader.load(url, (images: Array<{ img: HTMLImageElement }>) => {
            expect(images).to.have.lengthOf(1);
            const img = images[0]?.img;
            expect(img).to.be.instanceOf(Image);
            expect(img.complete).to.be.true;
            expect(img.naturalWidth).to.be.greaterThan(0);
            URL.revokeObjectURL(url); // Clean up Blob URL
            done();
        }, 0, 1, false, {});
    });
});

describe('ImageLoader sequence integration (code_128 sequence)', () => {
    it('should load images 1-10 from code_128 fixture', function(done) {
        const directory = '../../../../test/fixtures/code_128/';
        ImageLoader.load(directory, (images: Array<{ img: HTMLImageElement }>) => {
            expect(images).to.have.lengthOf(10);
            images.forEach((imgObj, idx) => {
                const img = imgObj.img;
                expect(img).to.be.instanceOf(Image);
                expect(img.complete).to.be.true;
                expect(img.naturalWidth).to.be.greaterThan(0);
                const num = idx + 1;
                const ext = '.jpg';
                expect(img.src).to.match(new RegExp(`image-${num.toString().padStart(3, '0')}${ext}$`));
            });
            done();
        }, 1, 10, true, {});
    });
});
