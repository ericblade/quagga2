
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import ArrayHelper from '../array_helper';

describe('Array Helper', () => {
    describe('init', () => {
        it('initializes an array with the given value', () => {
            const input = [0, 0, 0];
            ArrayHelper.init(input, 5);
            expect(input).to.deep.equal([5, 5, 5]);
        });
    });

    describe('shuffle', () => {
        let MathStub: sinon.SinonStub;
        before(() => {
            // presumably, this makes the shuffle deterministic so it can be tested
            MathStub = sinon.stub(Math as any, 'random').returns(0.5); // TODO: remove as any, and fix this type def issue
        });

        after(() => {
            MathStub.restore();
        });
        it('shuffles the content of an array', () => {
            const input = [1, 2, 3];
            const output = ArrayHelper.shuffle(input);
            expect(output).to.be.an('Array').with.length(3);
            expect(output).to.not.deep.equal([1, 2, 3]);
            expect(output).to.be.an('Array').that.contains(1);
            expect(output).to.be.an('Array').that.contains(2);
            expect(output).to.be.an('Array').that.contains(3);
        });
    });

    describe('toPointList', () => {
        it('converts an Array to a List of points', () => {
            const input = [[1, 2], [2, 2], [3, 2]];
            expect(ArrayHelper.toPointList(input)).to.equal('[[1,2],\r\n[2,2],\r\n[3,2]]');
        });
    });

    describe('threshold', () => {
        it('returns all elements above the given threshold', () => {
            const input = [1, 2, 3];
            expect(ArrayHelper.threshold(input, 2, (score) => score * 1.5)).to.deep.equal([2, 3]);
        });
    });

    describe('maxIndex', () => {
        it('gets the index of the biggest element in the array', () => {
            const input = [1, 2, 3];
            expect(ArrayHelper.maxIndex(input)).to.equal(2);
        });
    });

    describe('max', () => {
        it('gets the biggest element in the array', () => {
            const input = [1, 3, 2];
            expect(ArrayHelper.max(input)).to.equal(3);
        });
    });
});
