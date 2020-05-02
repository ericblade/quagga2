const { describe, it } = require('mocha');
const { expect } = require('chai');

const Q = require('..');
const Q2 = require('..').default;

describe('testing node require', () => {
    it('require works', () => {
        expect(Q).to.be.an('object');
        expect(Q.init).to.be.a('function');
        expect(Q.start).to.be.a('function');
        expect(Q.stop).to.be.a('function');
    });
    it('require default works', () => {
        expect(Q2).to.be.an('object');
        expect(Q.init).to.be.a('function');
        expect(Q.start).to.be.a('function');
        expect(Q.stop).to.be.a('function');
    });
});
