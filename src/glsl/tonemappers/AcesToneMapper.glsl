// #part /glsl/shaders/tonemappers/AcesToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/AcesToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vPosition;
out vec4 oColor;

vec3 aces(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

float aces(float x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = vec4(aces(src.rgb * uExposure), 1);
}
