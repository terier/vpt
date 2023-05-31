// #part /glsl/shaders/updateMask/vertex

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

// #part /glsl/shaders/updateMask/fragment

#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler3D;

uniform usampler3D uIdTexture;
uniform float uDepth;
uniform sampler2D uMaskValues;

in vec2 vPosition;
out vec4 oMaskValue;

void main() {
    uint instance = texture(uIdTexture, vec3(vPosition, uDepth)).r;
    oMaskValue = texelFetch(uMaskValues, ivec2(instance, 0), 0);
}
