import Code39Reader from './code_39_reader';
import { BarcodePosition, Barcode } from './barcode_reader';

const patterns = {
    AEIO: /[AEIO]/g,
    AZ09: /[A-Z0-9]/,
};

const plaintextcode = [
    { "digit_code": 0, "character_code": "0" },
    { "digit_code": 1, "character_code": "1" },
    { "digit_code": 2, "character_code": "2" },
    { "digit_code": 3, "character_code": "3" },
    { "digit_code": 4, "character_code": "4" },
    { "digit_code": 5, "character_code": "5" },
    { "digit_code": 6, "character_code": "6" },
    { "digit_code": 7, "character_code": "7" },
    { "digit_code": 8, "character_code": "8" },
    { "digit_code": 9, "character_code": "9" },
    { "digit_code": 10, "character_code": "B" },
    { "digit_code": 11, "character_code": "C" },
    { "digit_code": 12, "character_code": "D" },
    { "digit_code": 13, "character_code": "F" },
    { "digit_code": 14, "character_code": "G" },
    { "digit_code": 15, "character_code": "H" },
    { "digit_code": 16, "character_code": "J" },
    { "digit_code": 17, "character_code": "K" },
    { "digit_code": 18, "character_code": "L" },
    { "digit_code": 19, "character_code": "M" },
    { "digit_code": 20, "character_code": "N" },
    { "digit_code": 21, "character_code": "P" },
    { "digit_code": 22, "character_code": "Q" },
    { "digit_code": 23, "character_code": "R" },
    { "digit_code": 24, "character_code": "S" },
    { "digit_code": 25, "character_code": "T" },
    { "digit_code": 26, "character_code": "U" },
    { "digit_code": 27, "character_code": "V" },
    { "digit_code": 28, "character_code": "W" },
    { "digit_code": 29, "character_code": "X" },
    { "digit_code": 30, "character_code": "Y" },
    { "digit_code": 31, "character_code": "Z" }
];

class Code32Reader extends Code39Reader {
    FORMAT = 'code_32_reader';

    // TODO (this was todo in original repo, no text was there. sorry.)
    _checkChecksum(code: string) {
        return !!code;
    }

    _decode(row?: Array<number>, start?: BarcodePosition): Barcode | null {
        const result = super._decode(row, start);
        if (!result) {
            return null;
        }

        var code = result.code;

        if (!code) {
            return null;
        }

        code = code.replace(patterns.AEIO, '');

        if (!code.match(patterns.AZ09)) {
            if (ENV.development) {
                console.log('Failed AZ09 pattern code:', code);
            }
            return null;
        }

        if (!this._checkChecksum(code)) {
            return null;
        }

        var new_code = 0;
        var code_final;

        for (let i = 0; i <= code.length; i++) {
            let char_code = code.charAt(i);
            let search_digit_code = plaintextcode.find(e => e.character_code === char_code);

            if (typeof search_digit_code !== 'undefined') {
                let digit_code = search_digit_code.digit_code;

                let exponent_number = code.length - i - 1;

                digit_code = digit_code * Math.pow(32, exponent_number);
                new_code += digit_code;
            }
            
        }

        if (new_code.toString().length !== 9) {
            for (let n = 9; n > new_code.toString().length; n++) {
                code_final = "0"+new_code;
            }
        }

        code_final = "A"+new_code;

        result.code = code_final;
        return result;
    };
}

export default Code32Reader;
