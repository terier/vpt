// #part /glsl/shaders/tonemappers/UnrealToneMapper/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/tonemappers/UnrealToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;
uniform float uGamma;

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
    oColor = pow(vec4(unreal(src.rgb * uExposure), 1), vec4(1.0 / uGamma));
}
