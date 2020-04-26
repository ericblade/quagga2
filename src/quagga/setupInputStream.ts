import InputStream from "../input/input_stream";

export type InputStreamType = 'VideoStream' | 'ImageStream' | 'LiveStream';

function createVideoStream() {
    const video = document.createElement('video');
    return {
        video,
        inputStream: InputStream.createVideoStream(video),
    };
}

function createImageStream() {
    return { inputStream: InputStream.createImageStream() };
}

function createLiveStream(viewport: Element) {
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
        inputStream: InputStream.createLiveStream(video),
    };
}


// TODO: need to create an InputStream typescript interface, so we don't have an "any" in the next line
export default function setupInputStream(type: InputStreamType, viewport: Element) {
    switch (type) {
        case 'VideoStream':
            return createVideoStream();
        case 'ImageStream':
            return createImageStream();
        case 'LiveStream':
            return createLiveStream(viewport);
        default:
            console.error(`* setupInputStream invalid type ${type}`);
            return { video: null, inputStream: null };
    }
};
