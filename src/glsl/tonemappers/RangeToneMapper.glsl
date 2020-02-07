// #package glsl/shaders

// #section RangeToneMapper/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + vec2(1.0, 1.0)) * 0.5;
}

// #section RangeToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uMin;
uniform float uMax;

in vec2 vFragmentPosition;
out vec4 color;

void main() {
    vec4 src = texture(uTexture, vFragmentPosition);
    color = (src - uMin) / (uMax - uMin);
}
