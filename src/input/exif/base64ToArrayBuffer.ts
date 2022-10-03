export default function base64ToArrayBuffer(dataUrl: string) {
    const base64 = dataUrl.replace(/^data:([^;]+);base64,/gmi, '');
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}
