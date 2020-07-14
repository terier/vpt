// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section FCDDiffusion/compute

#version 310 es
precision highp float;
layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

uniform ivec3 uSize;
uniform vec3 uLightDirection;
//layout (r32f, binding = 0) readonly highp uniform image3D uEnergyDensityRead;
//layout (r32f, binding = 0) writeonly highp uniform image3D uEnergyDensityWrite;
layout (rgba32f, binding = 0) readonly highp uniform image3D uEnergyDensityRead;
layout (rgba32f, binding = 0) writeonly highp uniform image3D uEnergyDensityWrite;

layout (rgba32f, binding = 1) readonly highp uniform image3D uVolume;
// layout (rgba32f, binding = 2) readonly highp uniform image2D uTransferFunction;

uniform mediump sampler2D uTransferFunction;

void main() {
    ivec3 position = ivec3(gl_GlobalInvocationID);
    if (position.x < 1 || position.y < 1 || position.z < 1 ||
    position.x >= uSize.x - 1 || position.y >= uSize.y - 1 || position.z >= uSize.z - 1) {
        return;
    }
    //imageStore(uEnergyDensityWrite, position, vec4(1));

    float val = imageLoad(uVolume, position).r;
    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));

    float revAbsorption = float(1) - colorSample.a;
//    float revAbsorption = float(1);

//    float absorption = float(1) - val;
//    float absorption = val;

    for (int i = 0; i < 1; i++) {
        vec4 center = imageLoad(uEnergyDensityRead, position);
        float radiance = center.r;

//        float left = imageLoad(uEnergyDensityRead, position + ivec3(-1,  0, 0)).r;
//        float right = imageLoad(uEnergyDensityRead, position + ivec3( 1,  0, 0)).r;
//        float down = imageLoad(uEnergyDensityRead, position + ivec3( 0, -1, 0)).r;
//        float up = imageLoad(uEnergyDensityRead, position + ivec3( 0,  1, 0)).r;
//        float back = imageLoad(uEnergyDensityRead, position + ivec3( 0,  0, -1)).r;
//        float forward = imageLoad(uEnergyDensityRead, position + ivec3( 0,  0, 1)).r;

        vec3 grad = vec3(
            uLightDirection.x < 0.0 ?
                imageLoad(uEnergyDensityRead, position + ivec3( 1,  0, 0)).r - radiance :
                radiance - imageLoad(uEnergyDensityRead, position + ivec3(-1,  0, 0)).r,
            uLightDirection.y < 0.0 ?
                imageLoad(uEnergyDensityRead, position + ivec3( 0,  1, 0)).r - radiance :
                radiance - imageLoad(uEnergyDensityRead, position + ivec3( 0, -1, 0)).r,
            uLightDirection.z < 0.0 ?
                imageLoad(uEnergyDensityRead, position + ivec3( 0,  0, 1)).r - radiance :
                radiance - imageLoad(uEnergyDensityRead, position + ivec3( 0,  0, -1)).r
        );
        // (1 - absorption) * (p - 1/2 deltap)
        float convectionDelta = -dot(uLightDirection, grad) * 0.5;
        float new = revAbsorption * (radiance + convectionDelta);
        vec4 final = vec4(new, 0, 0, 0);
//        vec4 final = vec4(1, 0, 0, 0);

        imageStore(uEnergyDensityWrite, position, final);
    }
}

// #section FCDGenerate/vertex

#version 310 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

//debug
out vec2 vPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section FCDGenerate/fragment

#version 310 es
precision mediump float;

//layout (r32f, binding = 2) readonly highp uniform image3D uEnergyDensity;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uEnergyDensity;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

//debug
in vec2 vPosition;


@intersectCube

void main() {
//    float radiance = texture(uEnergyDensity, vec3(vPosition, 90)).r;
//    oColor = vec4(vec3(radiance), 1);
//    return;

    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec3 pos;
        float val;
        vec4 colorSample;
        vec4 accumulator = vec4(0.0);

        float energyDensity;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).r;

            energyDensity = texture(uEnergyDensity, pos).r;
//            energyDensity = imageLoad(uEnergyDensity, pos).r;

            colorSample = texture(uTransferFunction, vec2(val, 0.5));
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= colorSample.a * energyDensity;
//            colorSample.rgb *= colorSample.a;
            //colorSample.rgb = vec3(energyDensity);
            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        oColor = vec4(accumulator.rgb, 1.0);
    }
}

// #section FCDIntegrate/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCDIntegrate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = texture(uFrame, vPosition);
}

// #section FCDRender/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCDRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = texture(uAccumulator, vPosition);
}

// #section FCDReset/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCDReset/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0.0, 0.0, 0.0, 1.0);
}
