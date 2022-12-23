export class CommonUtils {

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
    return [
        parseInt(str.substring(1, 3), 16) / 255,
        parseInt(str.substring(3, 5), 16) / 255,
        parseInt(str.substring(5, 7), 16) / 255,
    ];
}

static rgb2hex(rgb) {
    const strings = rgb
        .map(x => Math.floor(x * 255).toString(16))
        .map(x => x.length < 2 ? `0${x}` : x);
    return `#${strings.join('')}`;
}

static clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

static lerp(a, b, x) {
    return a + x * (b - a);
}

static step(edge, x) {
    return x < edge ? 0 : 1;
}

static linstep(edge0, edge1, x) {
    const t = CommonUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t;
}

static smoothstep(edge0, edge1, x) {
    const t = CommonUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

static smootherstep(edge0, edge1, x) {
    const t = CommonUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
}

}
