#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;

in vec2 vPosition;
out vec4 color;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    float closestAcc = acc.w;
    float closestFrame = frame.w;
    color = closestFrame < closestAcc ? frame : acc;
}
