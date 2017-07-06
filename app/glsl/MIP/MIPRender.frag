#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    float acc = texture(uAccumulator, vPosition).r;
    oColor = vec4(acc, acc, acc, 1.0);
}
