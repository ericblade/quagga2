const ERROR_DESC = 'This may mean that the user has declined camera access, or the browser does not support media APIs. If you are running in iOS, you must use Safari.';

interface Error {
    name: string;
    message: string;
    stack?: string;
    code?: number;
}

export function enumerateDevices(): Promise<Array<MediaDeviceInfo>> {
    try {
        return navigator.mediaDevices.enumerateDevices();
    } catch (err) {
        const error: Error = new Error(`enumerateDevices is not defined. ${ERROR_DESC}`);
        error.code = -1;
        return Promise.reject(error);
    }
}

export function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
        return navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        const error: Error = new Error(`getUserMedia is not defined. ${ERROR_DESC}`);
        error.code = -1;
        return Promise.reject(error);
    }
}
