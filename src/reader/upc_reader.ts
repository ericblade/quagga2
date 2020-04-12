import EANReader from './ean_reader';
import { BarcodePosition, Barcode } from './barcode_reader';

class UPCReader extends EANReader {
    FORMAT = 'upc_a';
    _decode(row?: Array<number>, start?: BarcodePosition | number): Barcode | null {
        const result = EANReader.prototype._decode.call(this);

        if (result && result.code && result.code.length === 13 && result.code.charAt(0) === '0') {
            result.code = result.code.substring(1);
            return result;
        }
        return null;
    }
}

export default UPCReader;
