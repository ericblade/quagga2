import { pick } from 'lodash';
import { getUserMedia, enumerateDevices } from '../common/mediaDevices';
import { QuaggaBuildEnvironment, MediaTrackConstraintsWithDeprecated } from '../../type-definitions/quagga';

declare var ENV: QuaggaBuildEnvironment; // webpack injects ENV

let streamRef: MediaStream | null;

function waitForVideo(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
        let attempts = 10;

        function checkVideo() {
            if (attempts > 0) {
                if (video.videoWidth > 10 && video.videoHeight > 10) {
                    if (ENV.development) {
                        console.log(video.videoWidth + 'px x ' + video.videoHeight + 'px');
                    }
                    resolve();
                } else {
                    window.setTimeout(checkVideo, 500);
                }
            } else {
                reject('Unable to play video stream. Is webcam working?');
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
    try {
        const stream = await getUserMedia(constraints);
        streamRef = stream;
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true'); // not listed on MDN...
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
        await waitForVideo(video);
    } catch (err) {
        // console.warn('**** getUserMedia error?', err, err.message);
        throw err;
    }
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

export function pickConstraints(videoConstraints: MediaTrackConstraintsWithDeprecated): Promise<MediaStreamConstraints> {
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
    return tracks && tracks.length && tracks[0] || null;
}

/**
 * Used for accessing information about the active stream track and available video devices.
 */
const QuaggaJSCameraAccess = {
    request: function(video: HTMLVideoElement, videoConstraints: MediaTrackConstraintsWithDeprecated): Promise<any> {
        return pickConstraints(videoConstraints)
            .then((newConstraints) => initCamera(video, newConstraints))
            .catch(err => {
                // console.error('* Camera not available: ', err);
                throw err;
            });
    },
    release: function(): void {
        var tracks = streamRef && streamRef.getVideoTracks();
        if (tracks && tracks.length) {
            tracks[0].stop();
        }
        streamRef = null;
    },
    enumerateVideoDevices,
    getActiveStreamLabel: function(): string {
        const track = getActiveTrack();
        return track ? track.label : '';
    },
    getActiveTrack,
};

export default QuaggaJSCameraAccess;
