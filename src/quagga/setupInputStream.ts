import type { InputStreamType } from '../../type-definitions/quagga.d';
import type { InputStreamFactory } from 'input/input_stream/input_stream_base';

export default function setupInputStream(type: InputStreamType = 'LiveStream', viewport: Element | null, inputStreamFactory: InputStreamFactory) {
    switch (type) {
        case 'VideoStream': {
            const video = document.createElement('video');
            return {
                video,
                inputStream: inputStreamFactory.createVideoStream(video),
            };
        }
        case 'ImageStream':
            return { inputStream: inputStreamFactory.createImageStream() };
        case 'LiveStream': {
            let video: HTMLVideoElement | null = null;
            if (viewport) {
                video = viewport.querySelector('video');
                if (!video) {
                    video = document.createElement('video');
                    viewport.appendChild(video);
                }
            }
            return {
                video,
                inputStream: inputStreamFactory.createLiveStream(video as HTMLVideoElement),
            };
        }
        default:
            console.error(`* setupInputStream invalid type ${type}`);
            return { video: null, inputStream: null };
    }
}
