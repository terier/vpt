export function crc32table() {
    const POLY = 0xEDB88320;
    for (let crc = 0, i = 0, table = []; i < 256; i++) {
        crc = i;
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? crc >>> 1 ^ POLY : crc >>> 1;
        }
        table[i] = crc >>> 0;
    }
    return table;
}

export const c32t = crc32table();

export function crc32(data, crc = -1, xorout = -1) {
    for (let i = 0; i < data.length; i++) {
        crc = c32t[(crc ^ data[i]) & 0xFF] ^ crc >>> 8;
    }
    return (crc ^ xorout) >>> 0;
}

export function crc32tableless(data, crc = -1, xorout = -1) {
    const POLY = 0xEDB88320;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = crc & 1 ? crc >>> 1 ^ POLY : crc >>> 1;
        }
    }
    return (crc ^ xorout) >>> 0;
}

export function crc32optimized(data, crc = -1, xorout = -1) {
    for (let i = 0, s, a, b; i < data.length; i++) {
        s = crc ^ data[i];
        b = (s ^ s << 6) & 255;
        a = Math.imul(b, 8404996);
        crc = (crc >>> 8) ^
            Math.imul(b, 16843008) ^ Math.imul(b, 1052672) ^
            (b << 19) ^ (b << 17) ^ (b >>> 2) ^ a ^ (a >>> 1);
    }
    return (crc ^ xorout) >>> 0;
}
