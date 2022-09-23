import { readTagValue } from './readTagValue';

export function readTags(file: DataView, tiffStart: number, dirStart: number, strings: Record<number, string>, bigEnd: boolean) {
    const entries = file.getUint16(dirStart, !bigEnd);
    const tags: Record<string, number | null> = {};

    for (let i = 0; i < entries; i++) {
        const entryOffset = dirStart + i * 12 + 2;
        const tag = strings[file.getUint16(entryOffset, !bigEnd)];
        if (tag) {
            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
        }
    }
    return tags;
}

export default readTags;
