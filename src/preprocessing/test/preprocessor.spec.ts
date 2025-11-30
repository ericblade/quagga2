import { expect } from 'chai';
import ImageWrapper from '../../common/image_wrapper';
import { addBorder, applyPreprocessors, Preprocessors } from '../preprocessor';

describe('Preprocessors', () => {
    describe('addBorder', () => {
        it('should return the same image when borderSize is 0', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            data.fill(128);
            const wrapper = new ImageWrapper(size, data);
            
            const preprocessor = addBorder(0);
            const result = preprocessor(wrapper);
            
            expect(result).to.equal(wrapper);
            expect(result.data).to.deep.equal(data);
        });

        it('should return the same image when borderSize is negative', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            data.fill(128);
            const wrapper = new ImageWrapper(size, data);
            
            const preprocessor = addBorder(-5);
            const result = preprocessor(wrapper);
            
            expect(result).to.equal(wrapper);
        });

        it('should add white border and shrink image', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            data.fill(0); // Black image
            const wrapper = new ImageWrapper(size, data);
            
            const borderSize = 2;
            const preprocessor = addBorder(borderSize);
            const result = preprocessor(wrapper);
            
            // Size should remain the same
            expect(result.size.x).to.equal(10);
            expect(result.size.y).to.equal(10);
            
            // Border pixels should be white (255)
            // Top border
            for (let y = 0; y < borderSize; y++) {
                for (let x = 0; x < size.x; x++) {
                    expect(result.data[y * size.x + x]).to.equal(255, `Top border at (${x}, ${y})`);
                }
            }
            // Bottom border
            for (let y = size.y - borderSize; y < size.y; y++) {
                for (let x = 0; x < size.x; x++) {
                    expect(result.data[y * size.x + x]).to.equal(255, `Bottom border at (${x}, ${y})`);
                }
            }
            // Left border
            for (let y = 0; y < size.y; y++) {
                for (let x = 0; x < borderSize; x++) {
                    expect(result.data[y * size.x + x]).to.equal(255, `Left border at (${x}, ${y})`);
                }
            }
            // Right border
            for (let y = 0; y < size.y; y++) {
                for (let x = size.x - borderSize; x < size.x; x++) {
                    expect(result.data[y * size.x + x]).to.equal(255, `Right border at (${x}, ${y})`);
                }
            }
            
            // Center should contain shrunk black image (approximately 0)
            const centerX = Math.floor(size.x / 2);
            const centerY = Math.floor(size.y / 2);
            expect(result.data[centerY * size.x + centerX]).to.be.lessThan(50, 'Center should be dark');
        });

        it('should fill with white when border is too large', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            data.fill(0);
            const wrapper = new ImageWrapper(size, data);
            
            // Border of 5 on each side = 10 total, which equals the image size
            const preprocessor = addBorder(5);
            const result = preprocessor(wrapper);
            
            // All pixels should be white
            for (let i = 0; i < result.data.length; i++) {
                expect(result.data[i]).to.equal(255);
            }
        });
    });

    describe('applyPreprocessors', () => {
        it('should apply preprocessors in order', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            data.fill(100);
            const wrapper = new ImageWrapper(size, data);
            
            const calls: string[] = [];
            
            const preprocessor1 = (img: ImageWrapper) => {
                calls.push('first');
                return img;
            };
            
            const preprocessor2 = (img: ImageWrapper) => {
                calls.push('second');
                return img;
            };
            
            applyPreprocessors(wrapper, [preprocessor1, preprocessor2]);
            
            expect(calls).to.deep.equal(['first', 'second']);
        });

        it('should return original wrapper when no preprocessors', () => {
            const size = { x: 10, y: 10, type: 'XYSize' as const };
            const data = new Uint8Array(100);
            const wrapper = new ImageWrapper(size, data);
            
            const result = applyPreprocessors(wrapper, []);
            
            expect(result).to.equal(wrapper);
        });
    });

    describe('Preprocessors object', () => {
        it('should export addBorder function', () => {
            expect(Preprocessors.addBorder).to.be.a('function');
        });

        it('should create valid preprocessor from addBorder', () => {
            const preprocessor = Preprocessors.addBorder(5);
            expect(preprocessor).to.be.a('function');
        });
    });
});
