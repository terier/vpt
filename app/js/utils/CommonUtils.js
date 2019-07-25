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

function hex2rgb(str) {
    return {
        r: parseInt(str.substr(1, 3), 16) / 255,
        g: parseInt(str.substr(3, 5), 16) / 255,
        b: parseInt(str.substr(5, 7), 16) / 255
    };
}

function rgb2hex(r, g, b) {
    r = Number(Math.floor(r * 255)).toString(16);
    g = Number(Math.floor(g * 255)).toString(16);
    b = Number(Math.floor(b * 255)).toString(16);
    r = r.length < 2 ? "0" + r : r;
    g = g.length < 2 ? "0" + g : g;
    b = b.length < 2 ? "0" + b : b;
    return "#" + r + g + b;
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
    hex2rgb       : hex2rgb,
    rgb2hex       : rgb2hex,
    noimpl        : noimpl
};

})();
