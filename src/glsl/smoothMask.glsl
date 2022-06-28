// #part /glsl/shaders/smoothMask/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
    vFragmentPosition = aPosition * 0.5 + 0.5;
}

// #part /glsl/shaders/smoothMask/fragment

#version 300 es

precision highp float;
precision highp sampler3D;

uniform sampler3D uMaskTexture;
uniform float uDepth;

in vec2 vFragmentPosition;
out vec2 oMaskValue;

#define NUM_OFFSETS 27

void main() {
    vec3 voxelPosition = vec3(vFragmentPosition, uDepth);
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
