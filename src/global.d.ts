interface QuaggaBuildEnvironment {
    development?: boolean;
    node?: boolean;
}

// injected by the build system
declare const ENV: QuaggaBuildEnvironment;

declare module 'ndarray-pixels' {
    export function getPixels(data: Uint8Array, mimeType?: string): Promise<any>;
}
