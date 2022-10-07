export default function objectURLToBlob(url: string) {
    return new Promise<Blob>((resolve, reject) => {
        const http = new XMLHttpRequest();
        http.open('GET', url, true);
        http.responseType = 'blob';
        http.onreadystatechange = () => {
            if (http.readyState === XMLHttpRequest.DONE && (http.status === 200 || http.status === 0)) {
                resolve(http.response as Blob);
            }
        };
        http.onerror = reject;
        http.send();
    });
}
