// #package glsl/shaders

// #section ExposureToneMapper/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + vec2(1.0, 1.0)) * 0.5;
}

// #section ExposureToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vFragmentPosition;
out vec4 color;

const float gamma = 2.2;

void main() {
    vec4 rgba = texture(uTexture, vFragmentPosition);
    vec4 mapped = vec4(1.0) - exp(-rgb * uExposure);
    mapped = pow(mapped, 1.0 / gamma);
    color = vec4(mapped.rgb, 1.0);
}
