// #part /glsl/shaders/tonemappers/UnrealToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/UnrealToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vPosition;
out vec4 oColor;

vec3 unreal(vec3 x) {
    return x / (x + 0.155) * 1.019;
}

float unreal(float x) {
    return x / (x + 0.155) * 1.019;
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = vec4(unreal(src.rgb * uExposure), 1);
}
