import _parseCSSDimensionValues, { CSSDimensions } from './parseCSSDimensionValues';

export interface AreaConfig {
    bottom: string,
    left: string,
    right: string,
    top: string,
}

interface ImageContext {
    height: number,
    width: number,
}

export const dimensionsConverters = {
    top(dimension: CSSDimensions, context: ImageContext) {
        return dimension.unit === '%' ? Math.floor(context.height * (dimension.value / 100)) : null;
    },
    right(dimension: CSSDimensions, context: ImageContext) {
        return dimension.unit === '%' ? Math.floor(context.width - (context.width * (dimension.value / 100))) : null;
    },
    bottom(dimension: CSSDimensions, context: ImageContext) {
        return dimension.unit === '%' ? Math.floor(context.height - (context.height * (dimension.value / 100))) : null;
    },
    left(dimension: CSSDimensions, context: ImageContext) {
        return dimension.unit === '%' ? Math.floor(context.width * (dimension.value / 100)) : null;
    },
};

type ReduceReturnType = {
    bottom?: number | null,
    left?: number | null,
    right?: number | null,
    top?: number | null,
};

export default function computeImageArea(inputWidth: number, inputHeight: number, area: AreaConfig) {
    const context = { width: inputWidth, height: inputHeight };
    const keys = Object.keys(area) as Array<keyof typeof area>;

    const parsedArea = keys.reduce<ReduceReturnType>((result, key: keyof AreaConfig) => {
        const value = area[key];
        const parsed = _parseCSSDimensionValues(value);
        const calculated = dimensionsConverters[key](parsed, context);

        // eslint-disable-next-line no-param-reassign
        result[key] = calculated;
        return result;
    }, {});

    const result = {
        sx: parsedArea.left ?? 0,
        sy: parsedArea.top ?? 0,
        sw: inputWidth,
        sh: inputHeight,
    };
    if (parsedArea) {
        if (parsedArea.right && parsedArea.left) {
            result.sw = parsedArea.right - parsedArea.left;
        }
        if (parsedArea.bottom && parsedArea.top) {
            result.sh = parsedArea.bottom - parsedArea.top;
        }
    }
    return result;
}
