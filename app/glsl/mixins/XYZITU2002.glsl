%%XYZITU2002

vec3 rgb2xyz(vec3 rgb) {
    const mat3 RGB2XYZ = mat3(
        0.4124, 0.3576, 0.1805,
        0.2126, 0.7152, 0.0722,
        0.0193, 0.1192, 0.9505
    );

    return RGB2XYZ * rgb;
}

vec3 xyz2rgb(vec3 xyz) {
    const mat3 XYZ2RGB = mat3(
         3.240625, -1.537208, -0.498629,
        -0.968931,  1.875756,  0.041518,
         0.055710, -0.204021,  1.056996
    );

    return XYZ2RGB * xyz;
}

vec3 xyz2xyY(vec3 xyz) {
    float sum = xyz.x + xyz.y + xyz.z;
    return xyz.xyy / vec3(sum, sum, 1.0);
}

vec3 xyY2xyz(vec3 xyY) {
    return vec3(xyY.x, xyY.y, 1.0 - xyY.x - xyY.y) * xyY.z / xyY.y;
}
