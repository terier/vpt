export class CommonUtils {

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

}
