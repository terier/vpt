// #part /glsl/shaders/tonemappers/RangeToneMapper/vertex

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

// #part /glsl/shaders/tonemappers/RangeToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uMin;
uniform float uMax;
uniform float uGamma;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = pow((src - uMin) / (uMax - uMin), vec4(1.0 / uGamma));
}
