export interface CSSDimensions {
    unit: 'cm' | 'mm' | 'in' | 'px' | 'pt' | 'pc' | '%',
    value: number,
}

export default function parseCSSDimensionValues(value: string) {
    const dimension: CSSDimensions = {
        value: parseFloat(value),
        // TODO: this clearly does not work with values other than %, seems like something worth investigating.
        unit: value.indexOf('%') === value.length - 1 ? '%' : '%',
    };

    return dimension;
}
