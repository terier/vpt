// #part /glsl/shaders/smoothMask/vertex

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

// #part /glsl/shaders/smoothMask/fragment

#version 300 es

precision highp float;
precision highp sampler3D;

uniform sampler3D uMaskTexture;
uniform float uDepth;

in vec2 vPosition;
out vec2 oMaskValue;

#define NUM_OFFSETS 27

void main() {
    vec3 voxelPosition = vec3(vPosition, uDepth);
    vec2 maskValue = vec2(0);

    const vec3 offsets[NUM_OFFSETS] = vec3[NUM_OFFSETS](
        vec3(-1, -1, -1),
        vec3( 0, -1, -1),
        vec3( 1, -1, -1),
        vec3(-1,  0, -1),
        vec3( 0,  0, -1),
        vec3( 1,  0, -1),
        vec3(-1,  1, -1),
        vec3( 0,  1, -1),
        vec3( 1,  1, -1),

        vec3(-1, -1,  0),
        vec3( 0, -1,  0),
        vec3( 1, -1,  0),
        vec3(-1,  0,  0),
        vec3( 0,  0,  0),
        vec3( 1,  0,  0),
        vec3(-1,  1,  0),
        vec3( 0,  1,  0),
        vec3( 1,  1,  0),

        vec3(-1, -1,  1),
        vec3( 0, -1,  1),
        vec3( 1, -1,  1),
        vec3(-1,  0,  1),
        vec3( 0,  0,  1),
        vec3( 1,  0,  1),
        vec3(-1,  1,  1),
        vec3( 0,  1,  1),
        vec3( 1,  1,  1)
    );

    for (int i = 0; i < NUM_OFFSETS; i++) {
        vec3 voxel = voxelPosition + offsets[i] / vec3(textureSize(uMaskTexture, 0));
        maskValue += texture(uMaskTexture, voxel).rg;
    }

    oMaskValue = maskValue / float(NUM_OFFSETS);
}
