// typescript definitions for modules that we use that don't provide their own defs

declare module 'ndarray-linear-interpolate' {
    import Ndarray from 'ndarray';

    function d2(arr: Ndarray.NdArray, x: number, y: number): number;
}
