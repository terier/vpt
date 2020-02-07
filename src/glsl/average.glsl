// #package glsl/shaders

// #section average/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + vec2(1.0, 1.0)) * 0.5;
}

// #section average/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTextureAccumulator;
uniform mediump sampler2D uTextureNew;
uniform float uInvn; // inverse number of samples

in vec2 vFragmentPosition;
out vec4 color;

void main() {
    vec4 a = texture(uTextureAccumulator, vFragmentPosition);
    vec4 b = texture(uTextureNew, vFragmentPosition);
    color = a + (b - a) * uInvn;
}
