// #part /glsl/shaders/updateMask/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vFragmentPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/updateMask/fragment

#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler3D;

uniform usampler3D uIdTexture;
uniform float uDepth;
uniform sampler2D uMaskValues;

in vec2 vFragmentPosition;
out vec4 oMaskValue;

void main() {
    uint instance = texture(uIdTexture, vec3(vFragmentPosition, uDepth)).r;
    oMaskValue = texelFetch(uMaskValues, ivec2(instance, 0), 0);
}
