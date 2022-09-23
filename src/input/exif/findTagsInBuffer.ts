import { AvailableTags, ExifTags } from './constants';
import { readEXIFData } from './readEXIFData';

export function findTagsInBuffer(file: ArrayBufferLike, selectedTags = AvailableTags) {
    const dataView = new DataView(file);
    const length = file.byteLength;
    const exifTags = selectedTags.reduce<Record<number, string>>((result, selectedTag) => {
        const exifTag = (Object.keys(ExifTags) as unknown as Array<keyof typeof ExifTags>).filter((tag) => ExifTags[tag] === selectedTag)[0];
        if (exifTag) {
            // eslint-disable-next-line no-param-reassign
            result[exifTag] = selectedTag;
        }
        return result;
    }, {});
    let offset = 2;
    let marker;

    if ((dataView.getUint8(0) !== 0xFF) || (dataView.getUint8(1) !== 0xD8)) {
        return false;
    }

    while (offset < length) {
        if (dataView.getUint8(offset) !== 0xFF) {
            return false;
        }

        marker = dataView.getUint8(offset + 1);
        if (marker === 0xE1) {
            return readEXIFData(dataView, offset + 4, exifTags);
        }
        offset += 2 + dataView.getUint16(offset + 2);
    }

    return false;
}

export default findTagsInBuffer;
