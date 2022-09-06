export default function hsv2rgb(hsv: Array<number>, rgb = [0, 0, 0]) {
    const h = hsv[0];
    const s = hsv[1];
    const v = hsv[2];
    const c = v * s;

    // old version of this line, typescript complained that the order of operations was confusing and may be not what is intended.
    // const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    // correction applied from https://www.codespeedy.com/hsv-to-rgb-in-cpp/
    const x = c * (1 - (Math.abs((h / 60) % 2) - 1));

    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
        r = c;
        g = x;
    } else if (h < 120) {
        r = x;
        g = c;
    } else if (h < 180) {
        g = c;
        b = x;
    } else if (h < 240) {
        g = x;
        b = c;
    } else if (h < 300) {
        r = x;
        b = c;
    } else if (h < 360) {
        r = c;
        b = x;
    }
    // eslint-disable-next-line no-param-reassign
    rgb[0] = Math.trunc(((r + m) * 255));
    // eslint-disable-next-line no-param-reassign
    rgb[1] = Math.trunc(((g + m) * 255));
    // eslint-disable-next-line no-param-reassign
    rgb[2] = Math.trunc(((b + m) * 255));
    return rgb;
}
