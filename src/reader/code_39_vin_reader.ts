import Code39Reader from './code_39_reader';
import { BarcodePosition, Barcode } from './barcode_reader';

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
    public decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        const result = super.decode(row, start);
        if (!result) {
            return null;
        }

        var code = result.code;

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
    };
}

export default Code39VINReader;
