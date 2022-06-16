const toString = Object.prototype.toString;
const arrayLikePattern = /^\[object (?:Array|FileList)\]$/;

// thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
export function isArray(thing) {
    return toString.call(thing) === '[object Array]';
}

export function isArrayLike(obj) {
    return arrayLikePattern.test(toString.call(obj));
}

export function isEqual(a, b) {
    if (a === null && b === null) {
        return true;
    }

    if (typeof a === 'object' || typeof b === 'object') {
        return false;
    }

    return a === b;
}

// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
export function isNumeric(thing) {
    return !isNaN(parseFloat(thing)) && isFinite(thing);
}

export function isObject(thing) {
    return (thing && toString.call(thing) === '[object Object]');
}

export function isFunction(thing) {
    const getType = {};
    return thing && getType.toString.call(thing) === '[object Function]';
}

export function isEmail(email) {
    return email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}

export function isWebGL2Ready() {
    if (window.isWebGL2Ready == undefined) {
        const gl = document.createElement('canvas').getContext('webgl2');
        window.isWebGL2Ready = gl ? true : false;
        // console.log(`isWebGL2Ready: ${window.isWebGL2Ready}`);
    }
    return window.isWebGL2Ready;
}