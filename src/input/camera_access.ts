import { pick } from 'lodash';
import { getUserMedia, enumerateDevices } from '../common/mediaDevices';
import { MediaTrackConstraintsWithDeprecated } from '../../type-definitions/quagga.d';

let streamRef: MediaStream | null;

function waitForVideo(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
        let attempts = 10;

        function checkVideo(): void {
            if (attempts > 0) {
                if (video.videoWidth > 10 && video.videoHeight > 10) {
                    if (ENV.development) {
                        console.log(`* dev: checkVideo found ${video.videoWidth}px x ${video.videoHeight}px`);
                    }
                    resolve();
                } else {
                    window.setTimeout(checkVideo, 500);
                }
            } else {
                reject(new Error('Unable to play video stream. Is webcam working?'));
            }
            attempts--;
        }
        checkVideo();
    });
}

/**
 * Tries to attach the camera-stream to a given video-element
 * and calls the callback function when the content is ready
 * @param {Object} constraints
 * @param {Object} video
 */
async function initCamera(video: HTMLVideoElement, constraints: MediaStreamConstraints): Promise<void> {
    const stream = await getUserMedia(constraints);
    streamRef = stream;
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', 'true'); // not listed on MDN...
    // eslint-disable-next-line no-param-reassign
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    return waitForVideo(video);
}

function deprecatedConstraints(videoConstraints: MediaTrackConstraintsWithDeprecated): MediaTrackConstraints {
    const normalized = pick(videoConstraints, ['width', 'height', 'facingMode',
        'aspectRatio', 'deviceId']);

    if (typeof videoConstraints.minAspectRatio !== 'undefined' &&
            videoConstraints.minAspectRatio > 0) {
        normalized.aspectRatio = videoConstraints.minAspectRatio;
        console.log('WARNING: Constraint \'minAspectRatio\' is deprecated; Use \'aspectRatio\' instead');
    }
    if (typeof videoConstraints.facing !== 'undefined') {
        normalized.facingMode = videoConstraints.facing;
        console.log('WARNING: Constraint \'facing\' is deprecated. Use \'facingMode\' instead\'');
    }
    return normalized;
}

// TODO: #192 I don't think there's any good reason pickConstraints should return a Promise,
// I think it was just that way so it could be chained to other functions that did return a Promise.
// That's not necessary with async functions being a thing, so that should be fixed.
export function pickConstraints(videoConstraints: MediaTrackConstraintsWithDeprecated = {}): Promise<MediaStreamConstraints> {
    const video = deprecatedConstraints(videoConstraints);

    if (video && video.deviceId && video.facingMode) {
        delete video.facingMode;
    }
    return Promise.resolve({ audio: false, video });
}

async function enumerateVideoDevices(): Promise<Array<MediaDeviceInfo>> {
    const devices = await enumerateDevices();
    return devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput');
}

function getActiveTrack(): MediaStreamTrack | null {
    if (!streamRef) {
        return null;
    }
    const tracks = streamRef.getVideoTracks();
    return tracks && tracks?.length ? tracks[0] : null;
}

/**
 * Used for accessing information about the active stream track and available video devices.
 */
const QuaggaJSCameraAccess = {
    async request(video: HTMLVideoElement, videoConstraints?: MediaTrackConstraintsWithDeprecated): Promise<any> {
        const newConstraints = await pickConstraints(videoConstraints);
        return initCamera(video, newConstraints);
    },
    release(): void {
        const tracks = streamRef && streamRef.getVideoTracks();
        if (tracks && tracks.length) {
            tracks[0].stop();
        }
        streamRef = null;
    },
    enumerateVideoDevices,
    getActiveStreamLabel(): string {
        const track = getActiveTrack();
        return track ? track.label : '';
    },
    getActiveTrack,
};

export default QuaggaJSCameraAccess;
