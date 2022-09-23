// NOTE: (SOME OF) THIS IS BROWSER ONLY CODE.  Node does not have 'atob' built in, nor XMLHttpRequest.
// How exactly is this set of functions used in Quagga? Do we need the browser specific code? Do we
// need to port any part of this that doesn't work in Node to node?

import { AvailableTags } from './constants';
import { findTagsInBuffer } from './findTagsInBuffer';
import { objectURLToBlob } from './objectURLToBlob';
import { readToBuffer } from './readToBuffer';

export function findTagsInObjectURL(src: string, tags = AvailableTags) {
    if (/^blob:/i.test(src)) {
        return objectURLToBlob(src)
            .then(readToBuffer)
            .then((buffer) => findTagsInBuffer(buffer as ArrayBufferLike, tags)); // TODO: BAD TYPING
    }
    return Promise.resolve(null);
}

export default findTagsInObjectURL;
