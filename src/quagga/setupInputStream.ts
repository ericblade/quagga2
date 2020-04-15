export type InputStreamType = 'VideoStream' | 'ImageStream' | 'LiveStream';

// TODO: need to create an InputStream typescript interface, so we don't have an "any" in the next line
export default function setupInputStream(type: InputStreamType, viewport: HTMLElement, InputStream: any) {
    switch (type) {
        case 'VideoStream': {
            const video = document.createElement('video');
            return {
                video,
                inputStream: InputStream.createVideoStream(video),
            };
        }
        case 'ImageStream':
            return { inputStream: InputStream.createImageStream() };
        case 'LiveStream': { // TODO: test to see what happens if you run in node and ask for LiveStream, it probably fails spectacularly, and should fail gracefully
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
        default:
            console.error(`* setupInputStream invalid type ${type}`);
            return { video: null, inputStream: null };
    }
};
