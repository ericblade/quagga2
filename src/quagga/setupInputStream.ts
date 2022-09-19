import { InputStream } from '../input/input_stream/input_stream_base';
import type { InputStreamType } from '../../type-definitions/quagga.d';
import type { InputStreamFactory } from '../input/input_stream/input_stream_base';

interface InputStreamReturn {
    inputStream: InputStream | null;
    video: HTMLVideoElement | null;
}

export default function setupInputStream(type: InputStreamType = 'LiveStream', viewport: Element | null, inputStreamFactory: InputStreamFactory): InputStreamReturn {
    const ret: InputStreamReturn = { inputStream: null, video: null };
    switch (type) {
        case 'VideoStream':
            ret.video = document.createElement('video');
            ret.inputStream = inputStreamFactory.createVideoStream(ret.video);
            break;
        case 'ImageStream':
            ret.video = null;
            ret.inputStream = inputStreamFactory.createImageStream();
            break;
        case 'LiveStream':
            if (viewport) {
                ret.video = viewport.querySelector('video');
                if (!ret.video) {
                    ret.video = document.querySelector('video');
                    if (ret.video) {
                        viewport.appendChild(ret.video);
                    }
                }
            }
            ret.inputStream = ret.video ? inputStreamFactory.createLiveStream(ret.video) : null;
            break;
        default:
            ((x: never) => x)(type);
    }
    return ret;
}
