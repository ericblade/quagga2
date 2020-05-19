// NOTE: (SOME OF) THIS IS BROWSER ONLY CODE.  Node does not have 'atob' built in, nor XMLHttpRequest.
// How exactly is this set of functions used in Quagga? Do we need the browser specific code? Do we
// need to port any part of this that doesn't work in Node to node?

// Tags scraped from https://github.com/exif-js/exif-js
const ExifTags = { 0x0112: 'orientation' };
export const AvailableTags = Object.keys(ExifTags).map((key) => ExifTags[key]);

export function findTagsInObjectURL(src, tags = AvailableTags) {
    if (/^blob:/i.test(src)) {
        return objectURLToBlob(src)
            .then(readToBuffer)
            .then((buffer) => findTagsInBuffer(buffer, tags));
    }
    return Promise.resolve(null);
}

export function base64ToArrayBuffer(dataUrl) {
    const base64 = dataUrl.replace(/^data:([^;]+);base64,/gmi, '');
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}

function readToBuffer(blob) {
    return new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = function (e) {
            return resolve(e.target.result);
        };
        fileReader.readAsArrayBuffer(blob);
    });
}

function objectURLToBlob(url) {
    return new Promise((resolve, reject) => {
        const http = new XMLHttpRequest();
        http.open('GET', url, true);
        http.responseType = 'blob';
        http.onreadystatechange = function () {
            if (http.readyState === XMLHttpRequest.DONE && (http.status === 200 || http.status === 0)) {
                resolve(this.response);
            }
        };
        http.onerror = reject;
        http.send();
    });
}

export function findTagsInBuffer(file, selectedTags = AvailableTags) {
    const dataView = new DataView(file);
    const length = file.byteLength;
    const exifTags = selectedTags.reduce((result, selectedTag) => {
        const exifTag = Object.keys(ExifTags).filter((tag) => ExifTags[tag] === selectedTag)[0];
        if (exifTag) {
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

function readEXIFData(file, start, exifTags) {
    if (getStringFromBuffer(file, start, 4) !== 'Exif') {
        return false;
    }

    const tiffOffset = start + 6;
    let bigEnd;
    let tags;

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

    tags = readTags(file, tiffOffset, tiffOffset + firstIFDOffset, exifTags, bigEnd);
    return tags;
}

function readTags(file, tiffStart, dirStart, strings, bigEnd) {
    const entries = file.getUint16(dirStart, !bigEnd);
    const tags = {};

    for (let i = 0; i < entries; i++) {
        const entryOffset = dirStart + i * 12 + 2;
        const tag = strings[file.getUint16(entryOffset, !bigEnd)];
        if (tag) {
            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd);
        }
    }
    return tags;
}

function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
    const type = file.getUint16(entryOffset + 2, !bigEnd);
    const numValues = file.getUint32(entryOffset + 4, !bigEnd);

    switch (type) {
        case 3:
            if (numValues === 1) {
                return file.getUint16(entryOffset + 8, !bigEnd);
            }
    }

    return null;
}

function getStringFromBuffer(buffer, start, length) {
    let outstr = '';
    for (let n = start; n < start + length; n++) {
        outstr += String.fromCharCode(buffer.getUint8(n));
    }
    return outstr;
}
