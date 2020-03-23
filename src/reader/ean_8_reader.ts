import EANReader from './ean_reader';
import { BarcodeInfo } from './barcode_reader';

class EAN8Reader extends EANReader {
    FORMAT = 'ean_8';
    _decodePayload(inCode: BarcodeInfo, result: Array<number>, decodedCodes: Array<BarcodeInfo>) {
        var i,
            self = this;
        let outCode: BarcodeInfo | null = inCode;

        for ( i = 0; i < 4; i++) {
            outCode = self._decodeCode(outCode.end, self.CODE_G_START);
            if (!outCode) {
                return null;
            }
            result.push(outCode.code);
            decodedCodes.push(outCode);
        }

        if (!outCode) {
            return null;
        }
        const pattern = self._findPattern(self.MIDDLE_PATTERN, outCode.end, true, false);
        if (pattern === null) {
            return null;
        }
        let newCode: BarcodeInfo | null = { ...pattern, ...outCode };
        decodedCodes.push(newCode);

        for ( i = 0; i < 4; i++) {
            newCode = self._decodeCode(newCode.end, self.CODE_G_START);
            if (!newCode) {
                return null;
            }
            decodedCodes.push(newCode);
            result.push(newCode.code);
        }

        return inCode;
    };
}

export default EAN8Reader;
