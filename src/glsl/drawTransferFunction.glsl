// #package glsl/shaders

// #section drawTransferFunction/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section drawTransferFunction/fragment

#version 300 es
precision mediump float;

uniform vec2 uPosition;
uniform vec2 uSize;
uniform vec4 uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    float r = length((uPosition - vPosition) / uSize);
    oColor = uColor * exp(-r * r);
}
