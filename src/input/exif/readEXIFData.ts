import { getStringFromBuffer } from './getStringFromBuffer';
import { readTags } from './readTags';

export function readEXIFData(file: DataView, start: number, exifTags: Record<number, string>) {
    if (getStringFromBuffer(file, start, 4) !== 'Exif') {
        return false;
    }

    const tiffOffset = start + 6;
    let bigEnd;

    if (file.getUint16(tiffOffset) === 0x4949) {
        bigEnd = false;
    } else if (file.getUint16(tiffOffset) === 0x4D4D) {
        bigEnd = true;
    } else {
        return false;
    }

    if (file.getUint16(tiffOffset + 2, !bigEnd) !== 0x002A) {
        return false;
    }

    const firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEnd);
    if (firstIFDOffset < 0x00000008) {
        return false;
    }

    const tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, exifTags, bigEnd);
    return tags;
}

export default readEXIFData;
