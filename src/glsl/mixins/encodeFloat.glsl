// #package glsl/mixins

// #section encodeFloat

highp float shiftRight(highp float v, highp float amt) {
    v = floor(v) + 0.5;
    return floor(v / exp2(amt));
}

highp float shiftLeft(highp float v, highp float amt) {
    return floor(v * exp2(amt) + 0.5);
}

highp float maskLast(highp float v, highp float bits) {
    return mod(v, shiftLeft(1.0, bits));
}

highp float extractBits(highp float num, highp float from, highp float to) {
    from = floor(from + 0.5); to = floor(to + 0.5);
    return maskLast(shiftRight(num, from), to - from);
}

lowp vec4 encodeFloat(highp float val) {
    if (val == 0.0) {
        return vec4(0.0);
    }
    highp float sgn = val > 0.0 ? 0.0 : 1.0;
    val = abs(val);
    highp float exponent = floor(log2(val));
    highp float biasedExponent = exponent + 127.0;
    highp float fraction = ((val / exp2(exponent)) - 1.0) * 8388608.0;
    highp float t = biasedExponent / 2.0;
    highp float lastBitOfBiasedExponent = fract(t) * 2.0;
    highp float remainingBitsOfBiasedExponent = floor(t);
    highp float byte4 = extractBits(fraction, 0.0, 8.0) / 255.0;
    highp float byte3 = extractBits(fraction, 8.0, 16.0) / 255.0;
    highp float byte2 = (lastBitOfBiasedExponent * 128.0 + extractBits(fraction, 16.0, 23.0)) / 255.0;
    highp float byte1 = (sgn * 128.0 + remainingBitsOfBiasedExponent) / 255.0;
    return vec4(byte4, byte3, byte2, byte1);
}
