var CommonUtils = (function() {

function noop() {
}

function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

function lerp(a, b, x) {
    return a + x * (b - a);
}

function downloadJSON(json, filename) {
    var str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json));
    var a = document.createElement('a');
    a.setAttribute('href', str);
    a.setAttribute('download', filename);
    a.click();
    a = null;
}

function inherit(sub, sup) {
    sub.prototype = Object.create(sup.prototype);
    sub.prototype.constructor = sub;
    sub.prototype.sup = sup.prototype;
    sub.sup = sup;
}

function extend(out) {
    var out = out || {};
    for (i = 1; i < arguments.length; i++) {
        var obj = arguments[i];

        if (!obj) {
            continue;
        }

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (deep && typeof obj[key] === 'object') {
                    out[key] = extend(out[key], obj[key]);
                } else {
                    out[key] = obj[key];
                }
            }
        }
    }

    return out;
};

function parseColorHex(str) {
    return {
        r: parseInt(str.substr(1, 2), 16) / 255,
        g: parseInt(str.substr(3, 2), 16) / 255,
        b: parseInt(str.substr(5, 2), 16) / 255
    };
}

var noimpl = new Error('Not implemented!');

return {
    noop          : noop,
    clamp         : clamp,
    lerp          : lerp,
    downloadJSON  : downloadJSON,
    inherit       : inherit,
    extend        : extend,
    parseColorHex : parseColorHex,
    noimpl        : noimpl
};

})();
