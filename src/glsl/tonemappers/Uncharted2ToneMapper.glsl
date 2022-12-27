// #part /glsl/shaders/tonemappers/Uncharted2ToneMapper/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/tonemappers/Uncharted2ToneMapper/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uExposure;
uniform float uGamma;

in vec2 vPosition;

out vec4 oColor;

vec3 uncharted2Tonemap(vec3 x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    float W = 11.2;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 uncharted2(vec3 color) {
    const float W = 11.2;
    float exposureBias = 2.0;
    vec3 curr = uncharted2Tonemap(exposureBias * color);
    vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
    return curr * whiteScale;
}

float uncharted2Tonemap(float x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    float W = 11.2;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

float uncharted2(float color) {
    const float W = 11.2;
    const float exposureBias = 2.0;
    float curr = uncharted2Tonemap(exposureBias * color);
    float whiteScale = 1.0 / uncharted2Tonemap(W);
    return curr * whiteScale;
}

void main() {
    vec4 src = texture(uTexture, vPosition);
    oColor = pow(vec4(uncharted2(src.rgb * uExposure), 1), vec4(1.0 / uGamma));
}
