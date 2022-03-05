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

    // TODO (this was todo in original repo, no text was there. sorry.)
    protected _checkChecksum(code: string): boolean {
        return !!code;
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

        if (!this._checkChecksum(code)) {
            return null;
        }

        const code32 = this._decodeCode32(code);

        if (!code32) {
            return null;
        }

        result.code = code32;
        return result;
    }
}

export default Code32Reader;
