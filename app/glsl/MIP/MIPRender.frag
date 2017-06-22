#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 color;

void main() {
    color = texture(uAccumulator, vPosition);
}
