// #part /glsl/shaders/quad/vertex

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

// #part /glsl/shaders/quad/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vPosition);
}
