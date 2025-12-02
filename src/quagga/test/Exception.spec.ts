import { expect } from 'chai';
import { describe, it } from 'mocha';
import Exception from '../Exception';

describe('src/quagga/Exception', () => {
    describe('constructor', () => {
        it('creates an Exception with message and code', () => {
            const ex = new Exception('Test error message', -1);
            expect(ex.message).to.equal('Test error message');
            expect(ex.code).to.equal(-1);
            expect(ex).to.be.an.instanceof(Error);
            expect(ex).to.be.an.instanceof(Exception);
        });

        it('creates an Exception with message only', () => {
            const ex = new Exception('Test error message');
            expect(ex.message).to.equal('Test error message');
            expect(ex.code).to.be.undefined;
        });
    });

    describe('toJSON', () => {
        it('serializes message and code when JSON.stringify is called', () => {
            const ex = new Exception('Test error message', -1);
            const json = JSON.stringify(ex);
            const parsed = JSON.parse(json);
            expect(parsed.message).to.equal('Test error message');
            expect(parsed.code).to.equal(-1);
            expect(parsed.name).to.equal('Error');
        });

        it('includes descriptive error message in JSON output', () => {
            const errorDesc = 'getUserMedia is not defined. This may mean that the user has declined camera access, or the browser does not support media APIs. If you are running in iOS, you must use Safari.';
            const ex = new Exception(errorDesc, -1);
            const json = JSON.stringify(ex);
            const parsed = JSON.parse(json);
            expect(parsed.message).to.include('getUserMedia is not defined');
            expect(parsed.message).to.include('iOS');
            expect(parsed.message).to.include('Safari');
            expect(parsed.code).to.equal(-1);
        });

        it('returns proper object from toJSON method', () => {
            const ex = new Exception('Test message', 42);
            const result = ex.toJSON();
            expect(result).to.deep.equal({
                name: 'Error',
                message: 'Test message',
                code: 42,
            });
        });
    });
});
