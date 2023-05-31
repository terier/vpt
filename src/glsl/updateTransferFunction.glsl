// #part /glsl/shaders/updateTransferFunction/vertex

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

// #part /glsl/shaders/updateTransferFunction/fragment

#version 300 es
precision mediump float;

#define INV_2PI 0.15915494309

uniform sampler2D uColorStrip;
uniform vec4 uBackgroundColor;
uniform vec2 uInterpolationRange;

in vec2 vPosition;
out vec4 oColor;

void main() {
    float radius = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);

    // choose a color from the color strip based on the angle around the TF
    float offset = 0.5 / float(textureSize(uColorStrip, 0).x);
    vec4 color = texture(uColorStrip, vec2(angle * INV_2PI + offset, 0));

    // interpolate alpha smoothly, but do not interpolate color
    float smoothInterpolation = smoothstep(uInterpolationRange.x, uInterpolationRange.y, radius);
    float stepInterpolation = step(uInterpolationRange.x, radius);
    vec4 interpolation = vec4(vec3(stepInterpolation), smoothInterpolation);
    oColor = mix(uBackgroundColor, color, interpolation);
}