// #part /glsl/shaders/tonemappers/FilmicToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/FilmicToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vPosition;
out vec4 oColor;

vec3 filmic(vec3 x) {
    vec3 X = max(vec3(0.0), x - 0.004);
    vec3 result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
    return pow(result, vec3(2.2));
}

float filmic(float x) {
    float X = max(0.0, x - 0.004);
    float result = (X * (6.2 * X + 0.5)) / (X * (6.2 * X + 1.7) + 0.06);
    return pow(result, 2.2);
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = vec4(filmic(src.rgb * uExposure), 1);
}
