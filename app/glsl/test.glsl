%%test:vertex

#version 300 es
precision mediump float;

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%test:fragment

#version 300 es
precision mediump float;

out vec4 color;

void main() {
    color = vec4(1.0, 0.5, 0.2, 1.0);
}
