// #part /glsl/shaders/test/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/test/fragment

#version 300 es
precision mediump float;

out vec4 color;

void main() {
    color = vec4(1.0, 0.5, 0.2, 1.0);
}
