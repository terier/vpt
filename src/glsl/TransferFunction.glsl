// #part /glsl/shaders/TransferFunction/vertex

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

// #part /glsl/shaders/TransferFunction/fragment

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
