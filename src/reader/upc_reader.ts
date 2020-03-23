import EANReader from './ean_reader';

class UPCReader extends EANReader {
    FORMAT = 'upc_a';
    _decode() {
        const result = super._decode();
        if (result?.code?.length === 13 && result?.code?.charAt(0) === '0') {
            result.code = result.code.substring(1);
            return result;
        }
        return null;
    }
}

export default UPCReader;
