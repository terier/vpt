// #part /glsl/shaders/tonemappers/ArtisticToneMapper/vertex

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

// #part /glsl/shaders/tonemappers/ArtisticToneMapper/fragment

#version 300 es
precision mediump float;

#define M_PI 3.1415926535897932384626

uniform mediump sampler2D uTexture;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uSaturation;
uniform float uGamma;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 color = texture(uTexture, vPosition);
    color = (color - uLow) / (uHigh - uLow);
    const vec3 gray = normalize(vec3(1));
    color = vec4(mix(dot(color.rgb, gray) * gray, color.rgb, uSaturation), 1.0);
    float midpoint = (uMid - uLow) / (uHigh - uLow);
    float exponent = -log(midpoint) / log(2.0);
    color = pow(color, vec4(exponent / uGamma));
    oColor = vec4(color.rgb, 1.0);
}
