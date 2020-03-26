import Code39Reader from './code_39_reader';

function Code32Reader() {
    Code39Reader.call(this);
}

var patterns = {
    AEIO: /[AEIO]/g,
    AZ09: /[A-Z0-9]{17}/,
};

Code32Reader.prototype = Object.create(Code39Reader.prototype);
Code32Reader.prototype.constructor = Code32Reader;

Code32Reader.prototype._decode = function() {
    var result = Code39Reader.prototype._decode.apply(this);
    if (!result) {
        return null;
    }

    var code = result.code;

    if (!code) {
        return null;
    }

    code = code.replace(patterns.AEIO, '');

    if (!code.match(patterns.AZ09)) {
        if (ENV.development) {
            console.log('Failed pattern code:', code);
        }
        return null;
    }

    if (!this._checkChecksum(code)) {
        return null;
    }

    result.code = code;
    return result;
};

Code32Reader.prototype._checkChecksum = function(code) {
    // TODO
    return !!code;
};

export default Code32Reader;
