export default function parseCSSDimensionValues(value: string) {
    const dimension = {
        value: parseFloat(value),
        unit: value.indexOf('%') === value.length - 1 ? '%' : '%',
    };

    return dimension;
}
