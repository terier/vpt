// #part /glsl/shaders/updateTransferFunction/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/updateTransferFunction/fragment

#version 300 es
precision mediump float;

#define INV_2PI 0.15915494309

uniform sampler2D uColorStrip;
uniform vec4 uBackgroundColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    float radius = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);
    float offset = 0.5 / float(textureSize(uColorStrip, 0).x);
    vec4 color = texture(uColorStrip, vec2(angle * INV_2PI + offset, 0));
    oColor = mix(uBackgroundColor, color, radius);
}