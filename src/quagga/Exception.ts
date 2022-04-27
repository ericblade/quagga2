export default class Exception extends Error {
    code?: number;

    constructor(m: string, code?: number) {
        super(m);
        this.code = code;
        Object.setPrototypeOf(this, Exception.prototype);
    }
}
