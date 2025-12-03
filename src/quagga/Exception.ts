export default class Exception extends Error {
    code?: number;

    constructor(m: string, code?: number) {
        super(m);
        this.code = code;
        Object.setPrototypeOf(this, Exception.prototype);
    }

    /**
     * Custom JSON serialization to ensure error message is included.
     * The Error class's message property is non-enumerable by default,
     * so JSON.stringify would only include {code: -1} without this method.
     * This ensures consumers receive meaningful error information.
     */
    toJSON(): { message: string; code?: number; name: string } {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
        };
    }
}
