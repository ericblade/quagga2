import intersect from 'fast_array_intersect';

export default function computeIntersection<T>(arr1: Array<T>, arr2: Array<T>) {
    return intersect([arr1, arr2]);
}
