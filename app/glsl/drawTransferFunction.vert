#version 300 es
precision mediump float;

in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
