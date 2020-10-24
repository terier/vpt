// #package js/main

class CommonUtils {

static noop() {
}

static clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

static lerp(a, b, x) {
    return a + x * (b - a);
}

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

static trigger(event, element) {
    element.dispatchEvent(new Event(event));
}

static hex2rgb(str) {
    return {
        r: parseInt(str.substring(1, 3), 16) / 255,
        g: parseInt(str.substring(3, 5), 16) / 255,
        b: parseInt(str.substring(5, 7), 16) / 255
    };
}

static rgb2hex(color) {
    const str = {
        r: Number(Math.floor(color.r * 255)).toString(16),
        g: Number(Math.floor(color.g * 255)).toString(16),
        b: Number(Math.floor(color.b * 255)).toString(16),
    };

    const padded = {
        r: str.r.length < 2 ? "0" + str.r : str.r,
        g: str.g.length < 2 ? "0" + str.g : str.g,
        b: str.b.length < 2 ? "0" + str.b : str.b,
    };

    return "#" + padded.r + padded.g + padded.b;
}

static hsv2rgb(color) {
    const { h, s, v } = color;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: return { r: v, g: t, b: p };
        case 1: return { r: q, g: v, b: p };
        case 2: return { r: p, g: v, b: t };
        case 3: return { r: p, g: q, b: v };
        case 4: return { r: t, g: p, b: v };
        case 5: return { r: v, g: p, b: q };
    }
}

static get noimpl() {
    return new Error('Not implemented!');
}

}
