import { describe, it } from 'mocha';
import { expect } from 'chai';
import { enumerateDevices, getUserMedia } from '../../mediaDevices';

describe('mediaDevices (node)', () => {
    it('enumerateDevices rejects', async () => {
        try {
            const x = await enumerateDevices();
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect(x).to.not.exist;
        } catch (err: any) { // TODO: TS 4.4.4 gives us the welcome 'unknown' default for catches, but doesn't allow us to specify anything other than 'any'!! ?????
            expect(err.code).to.equal(-1);
            expect(err.message).to.include('enumerateDevices is not defined');
        }
    });
    it('getUserMedia rejects', async () => {
        try {
            const x = await getUserMedia({});
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect(x).to.not.exist;
        } catch (err: any) { // TODO: TS 4.4.4+ improvement?
            expect(err.code).to.equal(-1);
            expect(err.message).to.include('getUserMedia is not defined');
        }
    });
    it('enumerateDevices error includes helpful description when serialized', async () => {
        try {
            await enumerateDevices();
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect.fail('Should have thrown');
        } catch (err: any) {
            const json = JSON.stringify(err);
            const parsed = JSON.parse(json);
            expect(parsed.message).to.include('enumerateDevices is not defined');
            expect(parsed.message).to.include('iOS');
            expect(parsed.code).to.equal(-1);
        }
    });
    it('getUserMedia error includes helpful description when serialized', async () => {
        try {
            await getUserMedia({});
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,no-unused-expressions
            expect.fail('Should have thrown');
        } catch (err: any) {
            const json = JSON.stringify(err);
            const parsed = JSON.parse(json);
            expect(parsed.message).to.include('getUserMedia is not defined');
            expect(parsed.message).to.include('iOS');
            expect(parsed.code).to.equal(-1);
        }
    });
});
