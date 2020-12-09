// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section FCNGenerate/vertex

void main() {}

// #section FCNGenerate/fragment

void main() {}

// #section FCNIntegrate/vertex

#version 300 es
precision mediump float;
uniform vec3 uSize;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
//    vPosition.x = (aPosition.x + 1.0) * 0.5 * uSize.x;
//    vPosition.y =  (aPosition.x + 1.0) * 0.5 * uSize.y;
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCNIntegrate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uEnergyDensity;
uniform mediump sampler3D uDiffusion;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform vec3 uSize;
uniform vec3 uLight;
uniform float uAbsorptionCoefficient;
uniform int uSteps;
uniform float uRatio;
uniform float uLayer;
uniform float uScattering;

in vec2 vPosition;

layout (location = 0) out vec4 oEnergyDensity;
layout (location = 1) out vec4 oDiffusion;

void main() {
//    vec3 position = vec3(ivec2(vPosition + 0.5), uLayer);
    vec3 position = vec3(vPosition, uLayer);
    float radiance = texture(uEnergyDensity, position).r;
    if (position.x <= uSize.x || position.y <= uSize.y || position.z < uSize.z ||
    position.x >= 1.0 - uSize.x || position.y >= 1.0 - uSize.y || position.z >=  1.0 - uSize.z) {
        oEnergyDensity = vec4(radiance, 0, 0, 0);
        oDiffusion = vec4(0, 0, 0, 0);
        return;
    }
//    if (position.x < 1.5 || position.y < 1.5 || position.z < 1.5 ||
//    position.x >= uSize.x - 1.0 || position.y >= uSize.y - 1.0 || position.z >= uSize.z - 1.0) {
//        oEnergyDensity = vec4(1, 0, 0, 0);
//    }
//    return;
//    position /= uSize;
    float val = texture(uVolume, position).r;
    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));
    float absorption = colorSample.a * uAbsorptionCoefficient;
    float revAbsorption = float(1) - absorption;
    float newRadiance = 0.0;


    float left      = texture(uEnergyDensity, position + vec3(-uSize.x,  0,  0)).r;
    float right     = texture(uEnergyDensity, position + vec3(uSize.x,  0,  0)).r;
    float down      = texture(uEnergyDensity, position + vec3( 0, -uSize.y,  0)).r;
    float up        = texture(uEnergyDensity, position + vec3( 0,  uSize.y,  0)).r;
    float back      = texture(uEnergyDensity, position + vec3( 0, 0, -uSize.z)).r;
    float forward   = texture(uEnergyDensity, position + vec3( 0,  0, uSize.z)).r;

//    float left      = texture(uEnergyDensity, position + vec3(-1,  0,  0)).r;
//    float right     = texture(uEnergyDensity, position + vec3( 1,  0,  0)).r;
//    float down      = texture(uEnergyDensity, position + vec3( 0, -1,  0)).r;
//    float up        = texture(uEnergyDensity, position + vec3( 0,  1,  0)).r;
//    float back      = texture(uEnergyDensity, position + vec3( 0, 0, -1)).r;
//    float forward   = texture(uEnergyDensity, position + vec3( 0,  0, 1)).r;

    for (int i = 0; i < 1; i++) {
        vec3 grad = vec3(
            uLight.x < 0.0 ? right - radiance : radiance - left,
            uLight.y < 0.0 ? up - radiance : radiance - down,
            uLight.z < 0.0 ? forward - radiance : radiance - back
        );
        // (1 - absorption) * (p - 1/2 deltap)
        float convectionDelta = -dot(uLight, grad) * 0.5 / uRatio;

        newRadiance = revAbsorption * (radiance + convectionDelta);
    }

    oEnergyDensity = vec4(newRadiance, 0, 0, 0);

//    oEnergyDensity = vec4(radiance, 0, 0, 0);

    left            += texture(uEnergyDensity, position + vec3(-uSize.x,  0,  0)).r;
    right           += texture(uEnergyDensity, position + vec3(uSize.x,  0,  0)).r;
    down            += texture(uEnergyDensity, position + vec3( 0, -uSize.y,  0)).r;
    up              += texture(uEnergyDensity, position + vec3( 0,  uSize.y,  0)).r;
    back            += texture(uEnergyDensity, position + vec3( 0, 0, -uSize.z)).r;
    forward         += texture(uEnergyDensity, position + vec3( 0,  0, uSize.z)).r;

    float laplace = left + right + down + up + back + forward - 6.0 * radiance;

    float delta = laplace * radiance * uScattering / uRatio;
    oDiffusion = vec4(delta, 0, 0, 0);
//    oDiffusion = vec4(0, 0, 0, 0);
}

// #section FCNRender/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section FCNRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uEnergyDensity;
uniform mediump sampler3D uDiffusion;
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

    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(1.0, 1.0, 1.0, 1.0);
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
            energyDensity += texture(uDiffusion, pos).r;

            colorSample = texture(uTransferFunction, vec2(val, 0.5));
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= colorSample.a * energyDensity;
            //            colorSample.rgb *= colorSample.a;
//                        colorSample.rgb = vec3(energyDensity);
            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

//        oColor = vec4(accumulator.rgb, 1.0);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
    }
}

// #section FCNReset/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCNReset/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0.0, 0.0, 0.0, 1.0);
}
