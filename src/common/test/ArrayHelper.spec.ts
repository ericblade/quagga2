import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as ArrayHelper from '../ArrayHelper';

describe('Array Helper', () => {
    describe('init', () => {
        it('initializes an array with the given value', () => {
            const input = [0, 0, 0];
            ArrayHelper.init(input, 5);
            expect(input).to.deep.equal([5, 5, 5]);
        });
    });

    describe('maxIndex', () => {
        it('gets the index of the biggest element in the array', () => {
            const input = [1, 2, 3];
            expect(ArrayHelper.maxIndex(input)).to.equal(2);
        });
    });

    describe('sum', () => {
        it('adds all numbers in an array', () => {
            const input = [1, 2, 3];
            expect(ArrayHelper.sum(input)).to.equal(6);
        });
    });
});
