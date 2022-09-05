import computeDivisors from './computeDivisors';
import computeIntersection from './computeIntersection';

export interface ImageDimensions {
    x: number;
    y: number;
}

export enum PatchSize {
    xlarge = 1,
    large,
    medium,
    small,
    xsmall,
}

export default function calculatePatchSize(patchSize: PatchSize, imgSize: ImageDimensions) {
    const divisorsX = computeDivisors(imgSize.x);
    const divisorsY = computeDivisors(imgSize.y);
    const wideSide = Math.max(imgSize.x, imgSize.y);
    const common = computeIntersection(divisorsX, divisorsY);
    const nrOfPatchesList = [8, 10, 15, 20, 32, 60, 80];
    const nrOfPatchesIdx = patchSize;
    const nrOfPatches = nrOfPatchesList[nrOfPatchesIdx];
    const desiredPatchSize = Math.floor(wideSide / nrOfPatches);
    let optimalPatchSize;

    function findPatchSizeForDivisors(divisors: Array<number>) {
        let i = 0;
        let found = divisors[Math.floor(divisors.length / 2)];

        while (i < (divisors.length - 1) && divisors[i] < desiredPatchSize) {
            i++;
        }
        if (i > 0) {
            if (Math.abs(divisors[i] - desiredPatchSize) > Math.abs(divisors[i - 1] - desiredPatchSize)) {
                found = divisors[i - 1];
            } else {
                found = divisors[i];
            }
        }
        if (desiredPatchSize / found < nrOfPatchesList[nrOfPatchesIdx + 1] / nrOfPatchesList[nrOfPatchesIdx]
            && desiredPatchSize / found > nrOfPatchesList[nrOfPatchesIdx - 1] / nrOfPatchesList[nrOfPatchesIdx]) {
            return { x: found, y: found };
        }
        return null;
    }

    optimalPatchSize = findPatchSizeForDivisors(common);
    if (!optimalPatchSize) {
        optimalPatchSize = findPatchSizeForDivisors(computeDivisors(wideSide));
        if (!optimalPatchSize) {
            optimalPatchSize = findPatchSizeForDivisors((computeDivisors(desiredPatchSize * nrOfPatches)));
        }
    }
    return optimalPatchSize;
}
