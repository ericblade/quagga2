/**
 * Test to verify gl-matrix behavior before/after removing glMatrix.setMatrixArrayType(Array)
 *
 * This test verifies that vec2 operations work correctly regardless of whether
 * the underlying array type is Float32Array (default) or Array (via setMatrixArrayType).
 *
 * When we remove setMatrixArrayType(Array), vectors will return Float32Array instead
 * of regular Array, but all operations and element access should work identically.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { vec2, mat2 } from 'gl-matrix';

describe('gl-matrix behavior verification', () => {
    describe('vec2 operations', () => {
        it('should clone vectors and allow element access', () => {
            const original = [10, 20];
            const cloned = vec2.clone(original);

            // Element access should work
            expect(cloned[0]).to.equal(10);
            expect(cloned[1]).to.equal(20);

            // Length should be 2
            expect(cloned.length).to.equal(2);
        });

        it('should perform vec2.scale operations', () => {
            const vector = vec2.clone([10, 20]);
            const scaled = vec2.scale(vec2.create(), vector, 2);

            expect(scaled[0]).to.equal(20);
            expect(scaled[1]).to.equal(40);
        });

        it('should perform vec2.dot operations', () => {
            const v1 = vec2.clone([1, 0]);
            const v2 = vec2.clone([0, 1]);
            const v3 = vec2.clone([1, 0]);

            // Perpendicular vectors: dot product = 0
            expect(vec2.dot(v1, v2)).to.equal(0);

            // Parallel vectors: dot product = 1
            expect(vec2.dot(v1, v3)).to.equal(1);
        });

        it('should perform vec2.transformMat2 operations', () => {
            const vector = vec2.clone([1, 0]);
            const identity = mat2.create(); // Identity matrix
            const result = vec2.create();

            vec2.transformMat2(result, vector, identity);

            expect(result[0]).to.equal(1);
            expect(result[1]).to.equal(0);
        });

        it('should work with Math operations', () => {
            const angle = Math.PI / 4; // 45 degrees
            const vector = vec2.clone([Math.cos(angle), Math.sin(angle)]);

            // Should be approximately [0.707, 0.707]
            expect(vector[0]).to.be.closeTo(0.707, 0.01);
            expect(vector[1]).to.be.closeTo(0.707, 0.01);
        });

        it('should support array spread and destructuring', () => {
            const v1 = vec2.clone([1, 2]);
            const v2 = vec2.clone([3, 4]);

            // Destructuring should work
            const [x1, y1] = v1;
            expect(x1).to.equal(1);
            expect(y1).to.equal(2);

            // Spread should work for concatenation
            const combined = [...v1, ...v2];
            expect(combined).to.have.lengthOf(4);
            expect(combined[0]).to.equal(1);
            expect(combined[2]).to.equal(3);
        });

        it('should work in array methods', () => {
            const vectors = [
                vec2.clone([0, 0]),
                vec2.clone([1, 1]),
                vec2.clone([2, 2]),
            ];

            // Should work with array methods like map
            const scaled = vectors.map(v => vec2.scale(vec2.create(), v, 2));

            expect(scaled[1][0]).to.equal(2);
            expect(scaled[1][1]).to.equal(2);
        });
    });

    describe('mat2 operations', () => {
        it('should create and copy matrices', () => {
            const angle = Math.PI / 2; // 90 degrees
            const rotation = [
                Math.cos(angle), Math.sin(angle),
                -Math.sin(angle), Math.cos(angle)
            ];
            const rotMat = mat2.copy(mat2.create(), rotation);

            expect(rotMat).to.have.lengthOf(4);
            expect(rotMat[0]).to.be.closeTo(0, 0.01); // cos(90°) ≈ 0
            expect(rotMat[1]).to.be.closeTo(1, 0.01); // sin(90°) ≈ 1
        });

        it('should invert matrices', () => {
            const matrix = mat2.create(); // Identity
            const inverted = mat2.create();
            mat2.invert(inverted, matrix);

            // Inverted identity should still be identity
            expect(inverted[0]).to.equal(1);
            expect(inverted[1]).to.equal(0);
            expect(inverted[2]).to.equal(0);
            expect(inverted[3]).to.equal(1);
        });

        it('should transform vectors with matrices', () => {
            const vector = vec2.clone([1, 0]);
            const angle = Math.PI / 2; // 90 degree rotation
            const rotation = mat2.fromRotation(mat2.create(), angle);
            const result = vec2.create();

            vec2.transformMat2(result, vector, rotation);

            // [1,0] rotated 90° should be approximately [0,1]
            expect(result[0]).to.be.closeTo(0, 0.01);
            expect(result[1]).to.be.closeTo(1, 0.01);
        });
    });

    describe('type compatibility', () => {
        it('should work with existing code patterns in cv_utils.js', () => {
            // Simulate imageRef.toVec2() pattern
            function imageRef(x: number, y: number) {
                return {
                    x,
                    y,
                    toVec2() {
                        return vec2.clone([this.x, this.y]);
                    }
                };
            }

            const ref = imageRef(5, 10);
            const v = ref.toVec2();

            // This is the actual test from cv_utils.spec.js
            expect(v[0]).to.equal(5);
            expect(v[1]).to.equal(10);
        });

        it('should work with array-like operations in barcode_locator.js', () => {
            // Simulate the box structure used in barcode_locator
            const box = [
                vec2.clone([0, 0]),
                vec2.clone([10, 0]),
                vec2.clone([10, 10]),
                vec2.clone([0, 10]),
            ];

            // Should be able to iterate
            for (let j = 0; j < box.length; j++) {
                expect(box[j]).to.have.lengthOf(2);
                expect(typeof box[j][0]).to.equal('number');
            }

            // Should support transformations in-place
            const scale = 2;
            for (let j = 0; j < box.length; j++) {
                vec2.scale(box[j], box[j], scale);
            }

            expect(box[1][0]).to.equal(20);
        });
    });

    describe('Float32Array vs Array compatibility', () => {
        it('should behave the same for element access', () => {
            const regularArray = [1, 2];
            const float32Array = new Float32Array([1, 2]);

            expect(regularArray[0]).to.equal(float32Array[0]);
            expect(regularArray[1]).to.equal(float32Array[1]);
            expect(regularArray.length).to.equal(float32Array.length);
        });

        it('should work with destructuring', () => {
            const float32Array = new Float32Array([3, 4]);
            const [x, y] = float32Array;

            expect(x).to.equal(3);
            expect(y).to.equal(4);
        });

        it('should work with for loops', () => {
            const float32Array = new Float32Array([1, 2, 3, 4]);
            let sum = 0;

            for (let i = 0; i < float32Array.length; i++) {
                sum += float32Array[i];
            }

            expect(sum).to.equal(10);
        });

        it('should NOT work with some array methods', () => {
            // This documents a known difference between Array and TypedArray
            const float32Array = new Float32Array([1, 2, 3]);

            // Array.isArray returns false for TypedArray
            expect(Array.isArray(float32Array)).to.be.false;

            // But it is still iterable
            expect([...float32Array]).to.deep.equal([1, 2, 3]);
        });
    });
});
