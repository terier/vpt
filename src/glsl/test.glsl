// #part /glsl/shaders/test/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/test/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(1.0, 0.5, 0.2, 1.0);
}
