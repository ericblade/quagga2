import ImageWrapper from '../image_wrapper';

// TODO: not used?
export default function countNonZero(imageWrapper: ImageWrapper) {
    const { data } = imageWrapper;
    (data as number[]).reduce<number>((pv, cv) => {
        if (cv !== 0) {
            return pv + 1;
        }
        return pv;
    }, 0);
}
