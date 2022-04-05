// #part /glsl/shaders/tonemappers/ReinhardToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/ReinhardToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vPosition;
out vec4 oColor;

vec3 reinhard(vec3 x) {
    return x / (1.0 + x);
}

float reinhard(float x) {
    return x / (1.0 + x);
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = vec4(reinhard(src.rgb * uExposure), 1);
}
