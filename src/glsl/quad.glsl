// #package glsl/shaders

// #section quad/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + vec2(1.0, 1.0)) * 0.5;
}

// #section quad/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vFragmentPosition;
out vec4 color;

void main() {
    color = texture(uTexture, vFragmentPosition);
}
