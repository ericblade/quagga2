// typescript definitions for modules that we use that don't provide their own defs

declare module 'get-pixels' {
    function GetPixels(url: string, type: string | undefined, callback: (err: any, pixels: any) => void): void;
    export = GetPixels;
}
