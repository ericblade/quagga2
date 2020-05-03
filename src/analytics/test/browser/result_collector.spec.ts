/// <reference path="mocha">

import ResultCollector from '../../result_collector';
import ImageDebug from '../../../common/image_debug';
import { XYSize, QuaggaJSResultCollector, QuaggaJSCodeResult } from '../../../../type-definitions/quagga';
// import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect } from 'chai';
import sinon, { SinonSpy } from 'sinon';

interface MockCanvas {
    getContext(): {};
    toDataURL: sinon.SinonSpy;
    width: number;
    height: number;
}

let canvasMock: MockCanvas;
let imageSize: XYSize;
let config: QuaggaJSResultCollector;

describe("Result Collector", () => {
    beforeEach(function() {
        imageSize = {x: 320, y: 240};
        config = {
            capture: true,
            capacity: 20,
            blacklist: [{code: "3574660239843", format: "ean_13"}],
            filter: function() {
                return true;
            }
        };
        canvasMock = {
            getContext: function() {
                return {};
            },
            toDataURL: sinon.spy(),
            width: 0,
            height: 0
        };
        sinon.stub(document, 'createElement').callsFake((type) => {
            if (type === 'canvas') {
                return canvasMock as unknown as HTMLElement; // forcing type, eh
            }
            return undefined as unknown as HTMLElement;
        });
    });

    afterEach(function() {
        (document.createElement as SinonSpy).restore();
    });


    describe('create', function () {
        it("should return a new collector", function() {
            ResultCollector.create(config);
            expect( (document.createElement as SinonSpy).calledOnce).to.be.equal(true);
            expect( (document.createElement as SinonSpy).getCall(0).args[0]).to.equal("canvas");
        });
    });

    describe('addResult', function() {
        beforeEach(function() {
            sinon.stub(ImageDebug, 'drawImage').callsFake(() => { return true; });
        });

        afterEach(function() {
            (ImageDebug.drawImage as SinonSpy).restore();
        });

        it("should not add result if capacity is full", function(){
            config.capacity = 1;
            var collector = ResultCollector.create(config);
            collector.addResult([], imageSize, {});
            collector.addResult([], imageSize, {});
            collector.addResult([], imageSize, {});
            expect(collector.getResults()).to.have.length(1);
        });

        it("should only add results which match constraints", function() {
            const collector = ResultCollector.create(config);

            collector.addResult([], imageSize, {code: "423423443", format: "ean_13"});
            collector.addResult([], imageSize, {code: "3574660239843", format: "ean_13"});
            collector.addResult([], imageSize, {code: "3574660239843", format: "code_128"});

            const results = collector.getResults();
            expect(results).to.have.length(2);

            results.forEach(function(result: QuaggaJSCodeResult) {
                expect(result).not.to.deep.equal(config.blacklist![0]);
            });
        });

        it("should add result if no filter is set", function() {
            delete config.filter;
            var collector = ResultCollector.create(config);

            collector.addResult([], imageSize, {code: "423423443", format: "ean_13"});
            expect(collector.getResults()).to.have.length(1);
        });

        it("should not add results if filter returns false", function() {
            config.filter = () => (false);
            var collector = ResultCollector.create(config);

            collector.addResult([], imageSize, {code: "423423443", format: "ean_13"});
            expect(collector.getResults()).to.have.length(0);
        });

        it("should add result if no blacklist is set", function() {
            delete config.blacklist;
            var collector = ResultCollector.create(config);

            collector.addResult([], imageSize, {code: "3574660239843", format: "ean_13"});
            expect(collector.getResults()).to.have.length(1);
        });
    });
})
