// #package glsl/mixins

// #section YUVBT601

vec3 rgb2yuv(vec3 rgb) {
    const mat3 RGB2YUV = mat3(
         0.29900, -0.14713,  0.61500,
         0.58700, -0.28886, -0.51499,
         0.11400,  0.43600, -0.10001
    );

    return RGB2YUV * rgb;
}

vec3 yuv2rgb(vec3 yuv) {
    const mat3 YUV2RGB = mat3(
         1.00000,  1.00000,  1.00000,
         0.00000, -0.39465,  2.03211,
         1.13983, -0.58060,  0.00000
    );

    return YUV2RGB * yuv;
}
