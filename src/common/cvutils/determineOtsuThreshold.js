import * as ArrayHelper from '../ArrayHelper';
import computeHistogram from './computeHistogram';

export default function determineOtsuThreshold(imageWrapper, bitsPerPixel = 8) {
    let hist;
    const bitShift = 8 - bitsPerPixel;

    function px(init, end) {
        let sum = 0;
        for (let i = init; i <= end; i++) {
            sum += hist[i];
        }
        return sum;
    }

    function mx(init, end) {
        let sum = 0;

        for (let i = init; i <= end; i++) {
            sum += i * hist[i];
        }

        return sum;
    }

    function determineThreshold() {
        const vet = [0];
        let p1;
        let p2;
        let p12;
        let m1;
        let m2;
        let m12;
        const max = (1 << bitsPerPixel) - 1;

        hist = computeHistogram(imageWrapper, bitsPerPixel);
        for (let k = 1; k < max; k++) {
            p1 = px(0, k);
            p2 = px(k + 1, max);
            p12 = p1 * p2;
            if (p12 === 0) {
                p12 = 1;
            }
            m1 = mx(0, k) * p2;
            m2 = mx(k + 1, max) * p1;
            m12 = m1 - m2;
            vet[k] = m12 * m12 / p12;
        }
        return ArrayHelper.maxIndex(vet);
    }

    const threshold = determineThreshold();
    return threshold << bitShift;
}
