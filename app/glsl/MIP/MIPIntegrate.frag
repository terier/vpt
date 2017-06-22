#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;

in vec2 vPosition;
out float color;

void main() {
    float acc = texture(uAccumulator, vPosition).r;
    float frame = texture(uFrame, vPosition).r;
    color = max(acc, frame);
}
