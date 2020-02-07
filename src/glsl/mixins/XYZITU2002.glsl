// #package glsl/mixins

// #section XYZITU2002

vec3 rgb2xyz(vec3 rgb) {
    const mat3 RGB2XYZ = mat3(
        0.412453, 0.357580, 0.180423,
        0.212671, 0.715160, 0.072169,
        0.019334, 0.119193, 0.950227
    );

    return RGB2XYZ * rgb;
}

vec3 xyz2rgb(vec3 xyz) {
    const mat3 XYZ2RGB = mat3(
         3.240481, -1.537152, -0.498536,
        -0.969255,  1.875990,  0.041556,
         0.055647, -0.204041,  1.057311
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
