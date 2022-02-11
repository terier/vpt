// #part /js/utils/CommonUtils

class CommonUtils {

static downloadJSON(json, filename) {
    const str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json));
    let a = document.createElement('a');
    a.setAttribute('href', str);
    a.setAttribute('download', filename);
    a.click();
    a = null;
}

static readTextFile(onLoad, onError) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.addEventListener('change', function() {
        const reader = new FileReader();
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

static bind(object, { prefix = '', suffix = 'Listener'} = {}) {
    const methods = Object.getOwnPropertyNames(object.constructor.prototype);
    for (const method of methods) {
        if (method.startsWith(prefix) && method.endsWith(suffix)) {
            object[method] = object[method].bind(object);
        }
    }
}

static hex2rgb(str) {
    return {
        r: parseInt(str.substring(1, 3), 16) / 255,
        g: parseInt(str.substring(3, 5), 16) / 255,
        b: parseInt(str.substring(5, 7), 16) / 255
    };
}

static rgb2hex(r, g, b) {
    r = Number(Math.floor(r * 255)).toString(16);
    g = Number(Math.floor(g * 255)).toString(16);
    b = Number(Math.floor(b * 255)).toString(16);
    r = r.length < 2 ? "0" + r : r;
    g = g.length < 2 ? "0" + g : g;
    b = b.length < 2 ? "0" + b : b;
    return "#" + r + g + b;
}

}
