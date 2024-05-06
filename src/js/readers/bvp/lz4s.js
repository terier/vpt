export function decompress(src, dst) {
    let [srcIndex, dstIndex] = [0, 0];

    while (srcIndex < src.length) {
        const token = src[srcIndex++];
        if (token === 0) break;

        // literal copy
        let literalCount = token >>> 4;
        if (literalCount === 0x0f) {
            do {
                literalCount += src[srcIndex];
            } while (src[srcIndex++] === 0xff);
        }
        for (let i = 0; i < literalCount; i++) {
            dst[dstIndex++] = src[srcIndex++];
        }

        // match copy
        const offset = (src[srcIndex + 0] << 0)
                     | (src[srcIndex + 1] << 8);
        srcIndex += 2;
        let matchIndex = dstIndex - offset;
        let matchLength = token & 0x0f;
        if (matchLength === 0x0f) {
            do {
                matchLength += src[srcIndex];
            } while (src[srcIndex++] === 0xff);
        }
        for (let i = 0; i < matchLength; i++) {
            dst[dstIndex++] = dst[matchIndex++];
        }
    }

    return dstIndex;
}
