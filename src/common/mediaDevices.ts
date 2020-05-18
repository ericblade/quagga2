export function enumerateDevices(): Promise<Array<MediaDeviceInfo>> {
    try {
        return navigator.mediaDevices.enumerateDevices();
    } catch (err) {
        return Promise.reject(new Error('enumerateDevices is not defined'));
    }
}

export function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
        return navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        return Promise.reject(new Error('getUserMedia is not defined'));
    }
}
