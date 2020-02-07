// #package glsl/shaders

// #section ArtisticToneMapper/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vFragmentPosition = (aPosition + 1.0) * 0.5;
}

// #section ArtisticToneMapper/fragment

#version 300 es
precision mediump float;

#define M_PI 3.1415926535897932384626

uniform mediump sampler2D uTexture;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uSaturation;

in vec2 vFragmentPosition;
out vec4 oColor;

void main() {
    vec4 color = texture(uTexture, vFragmentPosition);
    color = (color - uLow) / (uHigh - uLow);
    const vec3 gray = normalize(vec3(1));
    color = vec4(mix(dot(color.rgb, gray) * gray, color.rgb, uSaturation), 1.0);
    float midpoint = (uMid - uLow) / (uHigh - uLow);
    float exponent = -log(2.0) / log(midpoint);
    color = pow(color, vec4(exponent));
    oColor = vec4(color.rgb, 1.0);
}
