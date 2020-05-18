import { expect } from 'chai';
import sinon, { SinonSpy } from 'sinon';
import {
    describe,
    beforeEach,
    afterEach,
    it,
} from 'mocha';
import ResultCollector from '../../result_collector';
import ImageDebug from '../../../common/image_debug';
import { XYSize, QuaggaJSResultCollector, QuaggaJSCodeResult } from '../../../../type-definitions/quagga.d';

interface MockCanvas {
    getContext(): {};
    toDataURL: sinon.SinonSpy;
    width: number;
    height: number;
}

let canvasMock: MockCanvas;
let imageSize: XYSize;
let config: QuaggaJSResultCollector;

describe('Result Collector', () => {
    beforeEach(() => {
        imageSize = { x: 320, y: 240 };
        config = {
            capture: true,
            capacity: 20,
            blacklist: [{ code: '3574660239843', format: 'ean_13' }],
            filter(): boolean {
                return true;
            },
        };
        canvasMock = {
            getContext(): {} {
                return {};
            },
            toDataURL: sinon.spy(),
            width: 0,
            height: 0,
        };
        sinon.stub(document, 'createElement').callsFake((type) => {
            if (type === 'canvas') {
                return canvasMock as unknown as HTMLElement; // forcing type, eh
            }
            return undefined as unknown as HTMLElement;
        });
    });

    afterEach(() => {
        (document.createElement as SinonSpy).restore();
    });


    describe('create', () => {
        it('should return a new collector', () => {
            ResultCollector.create(config);
            expect((document.createElement as SinonSpy).calledOnce).to.be.equal(true);
            expect((document.createElement as SinonSpy).getCall(0).args[0]).to.equal('canvas');
        });
    });

    describe('addResult', () => {
        beforeEach(() => {
            sinon.stub(ImageDebug, 'drawImage').callsFake(() => true);
        });

        afterEach(() => {
            (ImageDebug.drawImage as SinonSpy).restore();
        });

        it('should not add result if capacity is full', () => {
            config.capacity = 1;
            const collector = ResultCollector.create(config);
            collector.addResult([], imageSize, {});
            collector.addResult([], imageSize, {});
            collector.addResult([], imageSize, {});
            expect(collector.getResults()).to.have.length(1);
        });

        it('should only add results which match constraints', () => {
            const collector = ResultCollector.create(config);

            collector.addResult([], imageSize, { code: '423423443', format: 'ean_13' });
            collector.addResult([], imageSize, { code: '3574660239843', format: 'ean_13' });
            collector.addResult([], imageSize, { code: '3574660239843', format: 'code_128' });

            const results = collector.getResults();
            expect(results).to.have.length(2);

            results.forEach((result: QuaggaJSCodeResult) => {
                expect(result).not.to.deep.equal(config.blacklist![0]);
            });
        });

        it('should add result if no filter is set', () => {
            delete config.filter;
            const collector = ResultCollector.create(config);

            collector.addResult([], imageSize, { code: '423423443', format: 'ean_13' });
            expect(collector.getResults()).to.have.length(1);
        });

        it('should not add results if filter returns false', () => {
            config.filter = (): boolean => (false);
            const collector = ResultCollector.create(config);

            collector.addResult([], imageSize, { code: '423423443', format: 'ean_13' });
            expect(collector.getResults()).to.have.length(0);
        });

        it('should add result if no blacklist is set', () => {
            delete config.blacklist;
            const collector = ResultCollector.create(config);

            collector.addResult([], imageSize, { code: '3574660239843', format: 'ean_13' });
            expect(collector.getResults()).to.have.length(1);
        });
    });
});
