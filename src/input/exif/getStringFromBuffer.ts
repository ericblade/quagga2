export function getStringFromBuffer(buffer: DataView, start: number, length: number) {
    let outstr = '';
    for (let n = start; n < start + length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n));
    }
    return outstr;
}

export default getStringFromBuffer;
