export function enumerateDevices(): Promise<Array<MediaDeviceInfo>> {
    return navigator?.mediaDevices?.enumerateDevices?.() ?? Promise.reject(new Error('enumerateDevices is not defined'));
}

export function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    return navigator?.mediaDevices?.getUserMedia(constraints) ?? Promise.reject(new Error('getUserMedia is not defined'));
}
