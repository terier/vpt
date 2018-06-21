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

function readTextFile(onLoad, onError) {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.addEventListener('change', function() {
        var reader = new FileReader();
        if (onLoad) {
            reader.addEventListener('load', function() {
                onLoad(reader.result);
            });
        }
        if (onError) {
            reader.addEventListener('error', onError);
        }
        reader.readAsText(input.files[0]);
    });
    input.click();
}

function trigger(event, element) {
    element.dispatchEvent(new Event(event));
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
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                out[key] = obj[key];
            }
        }
    }
    return out;
}

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
    readTextFile  : readTextFile,
    trigger       : trigger,
    inherit       : inherit,
    extend        : extend,
    parseColorHex : parseColorHex,
    noimpl        : noimpl
};

})();
