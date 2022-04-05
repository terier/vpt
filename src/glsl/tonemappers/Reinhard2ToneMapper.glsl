// #part /glsl/shaders/tonemappers/Reinhard2ToneMapper/vertex

#version 300 es

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/tonemappers/Reinhard2ToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;

in vec2 vPosition;
out vec4 oColor;

vec3 reinhard2(vec3 x) {
    const float L_white = 4.0;
    return (x * (1.0 + x / (L_white * L_white))) / (1.0 + x);
}

float reinhard2(float x) {
    const float L_white = 4.0;
    return (x * (1.0 + x / (L_white * L_white))) / (1.0 + x);
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = vec4(reinhard2(src.rgb * uExposure), 1);
}
