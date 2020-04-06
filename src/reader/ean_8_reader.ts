import EANReader, { CODE_G_START, MIDDLE_PATTERN } from './ean_reader_new';
import { BarcodePosition, BarcodeInfo } from './barcode_reader';

class EAN8Reader extends EANReader {
    FORMAT = 'ean_8';
    protected _decodePayload(inCode: BarcodePosition, result: Array<number>, decodedCodes: Array<BarcodePosition>): BarcodeInfo | null {
        let code: BarcodeInfo | BarcodePosition | null = inCode;
        var i,
            self = this;

        for ( i = 0; i < 4; i++) {
            code = self._decodeCode(code.end, CODE_G_START);
            if (!code) {
                return null;
            }
            result.push((code as BarcodeInfo).code);
            decodedCodes.push(code);
        }

        code = self._findPattern(MIDDLE_PATTERN, code.end, true, false);
        if (code === null) {
            return null;
        }
        decodedCodes.push(code);

        for ( i = 0; i < 4; i++) {
            code = self._decodeCode(code.end, CODE_G_START);
            if (!code) {
                return null;
            }
            decodedCodes.push(code);
            result.push((code as BarcodeInfo).code);
        }

        return code as BarcodeInfo;
    };
}

export default EAN8Reader;
