// #part /glsl/shaders/tonemappers/RangeToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/RangeToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uMin;
uniform float uMax;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = (src - uMin) / (uMax - uMin);
}
