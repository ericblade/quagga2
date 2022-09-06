import { AreaConfig } from '../../locator/test/barcode_locator.spec';
import _parseCSSDimensionValues from './parseCSSDimensionValues';

export const dimensionsConverters = {
    top(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.height * (dimension.value / 100)) : null;
    },
    right(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.width - (context.width * (dimension.value / 100))) : null;
    },
    bottom(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.height - (context.height * (dimension.value / 100))) : null;
    },
    left(dimension, context) {
        return dimension.unit === '%' ? Math.floor(context.width * (dimension.value / 100)) : null;
    },
};

export default function computeImageArea(inputWidth: number, inputHeight: number, area: AreaConfig) {
    const context = { width: inputWidth, height: inputHeight };

    const parsedArea = Object.keys(area).reduce((result, key: keyof AreaConfig) => {
        const value = area[key];
        const parsed = _parseCSSDimensionValues(value);
        const calculated = dimensionsConverters[key](parsed, context);

        // eslint-disable-next-line no-param-reassign
        result[key] = calculated;
        return result;
    }, {});

    return {
        sx: parsedArea.left,
        sy: parsedArea.top,
        sw: parsedArea.right - parsedArea.left,
        sh: parsedArea.bottom - parsedArea.top,
    };
}
