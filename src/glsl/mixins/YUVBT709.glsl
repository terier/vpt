// #package glsl/mixins

// #section YUVBT709

vec3 rgb2yuv(vec3 rgb) {
    const mat3 RGB2YUV = mat3(
         0.21260, -0.09991,  0.61500,
         0.71520, -0.33609, -0.55861,
         0.07220,  0.43600, -0.05639
    );

    return RGB2YUV * rgb;
}

vec3 yuv2rgb(vec3 yuv) {
    const mat3 YUV2RGB = mat3(
         1.00000,  1.00000,  1.00000,
         0.00000, -0.21482,  2.12798,
         1.28033, -0.38059,  0.00000
    );

    return YUV2RGB * yuv;
}
