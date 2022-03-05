/* eslint-disable class-methods-use-this */
import { Barcode } from './barcode_reader';
import Code39Reader from './code_39_reader';

const patterns = {
    IOQ: /[IOQ]/g,
    AZ09: /[A-Z0-9]{17}/,
};

class Code39VINReader extends Code39Reader {
    FORMAT = 'code_39_vin';

    // TODO (this was todo in original repo, no text was there. sorry.)
    protected _checkChecksum(code: string): boolean {
        return !!code;
    }

    // Cribbed from:
    // https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/client/result/VINResultParser.java
    public decode(): Barcode | null {
        const result = super.decode();
        if (!result) {
            return null;
        }

        let { code } = result;

        if (!code) {
            return null;
        }

        code = code.replace(patterns.IOQ, '');

        if (!code.match(patterns.AZ09)) {
            if (ENV.development) {
                console.log('Failed AZ09 pattern code:', code);
            }
            return null;
        }

        if (!this._checkChecksum(code)) {
            return null;
        }

        result.code = code;
        return result;
    }
}

export default Code39VINReader;
