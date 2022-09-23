export function readTagValue(file: DataView, entryOffset: number, tiffStart: number, dirStart: number, bigEnd: boolean) {
    const type = file.getUint16(entryOffset + 2, !bigEnd);
    const numValues = file.getUint32(entryOffset + 4, !bigEnd);

    switch (type) {
        case 3:
            if (numValues === 1) {
                return file.getUint16(entryOffset + 8, !bigEnd);
            }
            break;
        default:
            break;
    }

    return null;
}

export default readTagValue;
