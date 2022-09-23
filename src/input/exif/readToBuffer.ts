export function readToBuffer(blob: Blob): Promise<string | ArrayBuffer | null | undefined> {
    return new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = function onload(e) {
            return resolve(e.target?.result);
        };
        fileReader.readAsArrayBuffer(blob);
    });
}

export default readToBuffer;
