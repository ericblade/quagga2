import Code39Reader from './code_39_reader';

const patterns = {
    AEIO: /[AEIO]/g,
    AZ09: /[A-Z0-9]/,
};

const code32set = '0123456789BCDFGHJKLMNPQRSTUVWXYZ';

class Code32Reader extends Code39Reader {
    FORMAT = 'code_32_reader';

    protected _decodeCode32(code: string) {
        if (/[^0-9BCDFGHJKLMNPQRSTUVWXYZ]/.test(code)) {
            return null;
        }
        let res = 0;
        for (let i = 0; i < code.length; i++) {
            res = res * 32 + code32set.indexOf(code[i]);
        }
        let code32 = `${res}`;
        if (code32.length < 9) {
            code32 = ('000000000' + code32).slice(-9);
        }
        return 'A' + code32;
    }

    // Italian Pharmacode check digit: double the even positions, then the
    // remainder of the sum divided by 10. See the 1988 ministerial decree.
    protected _checkChecksum(code: string): boolean {
        const digits = code.charAt(0) === 'A' ? code.slice(1) : code;
        if (!/^\d{9}$/.test(digits)) {
            return false;
        }
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            let value = digits.charCodeAt(i) - 48;
            if (i % 2 === 1) {
                value *= 2;
                if (value > 9) {
                    value -= 9;
                }
            }
            sum += value;
        }
        return (sum % 10) === (digits.charCodeAt(8) - 48);
    }

    public decode() {
        const result = super.decode();
        if (!result) {
            return null;
        }

        let code = result.code;

        if (!code) {
            return null;
        }

        code = code.replace(patterns.AEIO, '');

        const code32 = this._decodeCode32(code);

        if (!code32 || !this._checkChecksum(code32)) {
            return null;
        }

        result.code = code32;
        return result;
    }
}

export default Code32Reader;
