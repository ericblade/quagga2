/* eslint-disable no-bitwise */
// TODO: Not used?
import { ImageWrapper } from "quagga";

enum Operation {
    Or,
    And,
    Xor,
}

function base(op: Operation) {
    return (aImageWrapper: ImageWrapper, bImageWrapper: ImageWrapper, outImageWrapper: ImageWrapper) => {
        let { length } = aImageWrapper.data;

        const aImageData = aImageWrapper.data;
        const bImageData = bImageWrapper.data;
        const cImageData = outImageWrapper.data;

        while (length--) {
            switch (op) {
                case Operation.Or:
                    cImageData[length] = aImageData[length] | bImageData[length];
                    break;
                case Operation.And:
                    cImageData[length] = aImageData[length] & bImageData[length];
                    break;
                case Operation.Xor:
                    cImageData[length] = aImageData[length] ^ bImageData[length];
                    break;
                default:
                    throw new Error('internal error in bitwise parameters');
                    break;
            }
        }
    };
}

export function bitwiseNot(aImageWrapper: ImageWrapper, bImageWrapper: ImageWrapper) {
    let { length } = aImageWrapper.data;
    const aImageData = aImageWrapper.data;
    const bImageData = bImageWrapper.data;
    while (length--) {
        bImageData[length] = ~aImageData[length];
    }
}

export const bitwiseOr = base(Operation.Or);
export const bitwiseXor = base(Operation.Xor);
export const bitwiseAnd = base(Operation.And);
