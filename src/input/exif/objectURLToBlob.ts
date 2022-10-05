export default function objectURLToBlob(url: string) {
    return new Promise<Blob>((resolve, reject) => {
        const http = new XMLHttpRequest();
        http.open('GET', url, true);
        http.responseType = 'blob';
        http.onreadystatechange = function () {
            if (http.readyState === XMLHttpRequest.DONE && (http.status === 200 || http.status === 0)) {
                resolve(this.response as Blob); // TODO: grrrrr as Blob may not be right here
            }
        };
        http.onerror = reject;
        http.send();
    });
}
