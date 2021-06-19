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
#define DIRECTIONAL 0.5
precision mediump float;

uniform mediump sampler3D uEnergyDensity;
uniform mediump sampler3D uDiffusion;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform vec3 uStep;
uniform vec3 uSize;
//uniform vec3 uLight;
uniform float uAbsorptionCoefficient;
uniform int uNLights;
uniform float uRatio;
uniform float uLayer;
uniform float uScattering;
uniform float uTimeStep;
uniform float uJacobiWeight;
uniform float uEulerJacobiMix;
uniform vec4 uLights[4];

in vec2 vPosition;

layout (location = 0) out vec4 oEnergyDensity;
layout (location = 1) out float oDiffusion;

vec2 convection(in float radiance, in float baseAbsorption, in vec3 light,
                in float left, in float right, in float down, in float up, in float back, in float forward) {

    float newRadiance = 0.0;

    light = normalize(light);

    vec3 grad = 0.5 * vec3(right - left, up - down, forward - back);

//    vec3 grad = vec3(
//        light.x < 0.0 ? right - radiance : radiance - left,
//        light.y < 0.0 ? up - radiance : radiance - down,
//        light.z < 0.0 ? forward - radiance : radiance - back
//    );

    float convection = -0.5 * dot(light, grad);
    float absorption = -baseAbsorption * radiance;

//    return radiance + (convection + absorption) * uTimeStep;
    return vec2(convection, absorption);
}

vec2 convectionPL(in float radiance, in float baseAbsorption, in vec3 light, in vec3 position,
in float left, in float right, in float down, in float up, in float back, in float forward) {

    float newRadiance = 0.0;

    light = normalize(position - light);

    vec3 grad = vec3(
        light.x < 0.0 ? right - radiance : radiance - left,
        light.y < 0.0 ? up - radiance : radiance - down,
        light.z < 0.0 ? forward - radiance : radiance - back
    );

    float convection = -0.5 * dot(light, grad);
    float absorption = -baseAbsorption * radiance;
//    return radiance + (convection + absorption) * uTimeStep;
    return vec2(convection, absorption);
}


float componentSum(in vec4 vector) {
    return vector.r + vector.g + vector.b + vector.a;
}

void main() {
    vec3 position = vec3(vPosition, uLayer);
    vec4 radiance = texture(uEnergyDensity, position);
    if (position.x < uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x > 1.0 - uStep.x || position.y > 1.0 - uStep.y || position.z > 1.0 - uStep.z) {
        oEnergyDensity = vec4(radiance);
        oDiffusion = 0.0;
        return;
    }

    float val = texture(uVolume, position).r;
    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));
    float baseAbsorption = colorSample.a * uAbsorptionCoefficient;

//    float newRadiance = 0.0;

    vec4 left      = texture(uEnergyDensity, position + vec3(-uStep.x,  0,  0));
    vec4 right     = texture(uEnergyDensity, position + vec3( uStep.x,  0,  0));
    vec4 down      = texture(uEnergyDensity, position + vec3( 0, -uStep.y,  0));
    vec4 up        = texture(uEnergyDensity, position + vec3( 0,  uStep.y,  0));
    vec4 back      = texture(uEnergyDensity, position + vec3( 0,  0, -uStep.z));
    vec4 forward   = texture(uEnergyDensity, position + vec3( 0,  0,  uStep.z));

    vec4 newRadiance = vec4(0);
    float total_convection = 0.0;
    float total_radiance = 0.0;
    vec2 convectionAbsorption;
    float denominator = baseAbsorption + 6.0 * uScattering;



    float total_left    = componentSum(left) + texture(uDiffusion, position + vec3(-uStep.x,  0,  0)).r;
    float total_right   = componentSum(right) + texture(uDiffusion, position + vec3(uStep.x,  0,  0)).r;
    float total_down    = componentSum(down) + texture(uDiffusion, position + vec3( 0, -uStep.y,  0)).r;
    float total_up      = componentSum(up) + texture(uDiffusion, position + vec3( 0,  uStep.y,  0)).r;
    float total_back    = componentSum(back) + texture(uDiffusion, position + vec3( 0, 0, -uStep.z)).r;
    float total_forward = componentSum(forward) + texture(uDiffusion, position + vec3( 0,  0, uStep.z)).r;

    float laplace = total_left + total_right + total_down + total_up + total_back + total_forward - 6.0 * componentSum(radiance);

    float diffusion = colorSample.a * uScattering * laplace;

    for (int i = 0; i < uNLights; i++) {
        total_radiance += radiance[i];
        if (uLights[i].a < DIRECTIONAL) {
            convectionAbsorption = convection(radiance[i], baseAbsorption, uLights[i].xyz,
                left[i], right[i], down[i], up[i], back[i], forward[i]);
        } else if (distance(position * uSize, uLights[i].xyz * uSize) <= 2.0) {
            convectionAbsorption = vec2(radiance[i], 0);
        } else {
            convectionAbsorption = convectionPL(radiance[i], baseAbsorption, uLights[i].xyz, position,
                left[i], right[i], down[i], up[i], back[i], forward[i]);
        }
        float derivative = convectionAbsorption.x + convectionAbsorption.y;
        float eulerRadiance = radiance[i] + (derivative + diffusion) * uTimeStep;

//        float jacobiRadiance = (convectionAbsorption.x + diffusion + 6.0 * uScattering * radiance[i]) / (denominator);
//        float weightedJacobi = mix(radiance[i], jacobiRadiance, uJacobiWeight);
//        float jacobiRadiance = (convectionAbsorption.x) / (baseAbsorption);
        newRadiance[i] = eulerRadiance;

//        newRadiance[i] = mix(eulerRadiance, weightedJacobi, uEulerJacobiMix);
//        if (isinf(weightedJacobi)) {
//            newRadiance[i] = 0.5;
//        }
    }

    oEnergyDensity = newRadiance;

//    float total_left    = componentSum(left) + texture(uDiffusion, position + vec3(-uStep.x,  0,  0)).r;
//    float total_right   = componentSum(right) + texture(uDiffusion, position + vec3(uStep.x,  0,  0)).r;
//    float total_down    = componentSum(down) + texture(uDiffusion, position + vec3( 0, -uStep.y,  0)).r;
//    float total_up      = componentSum(up) + texture(uDiffusion, position + vec3( 0,  uStep.y,  0)).r;
//    float total_back    = componentSum(back) + texture(uDiffusion, position + vec3( 0, 0, -uStep.z)).r;
//    float total_forward = componentSum(forward) + texture(uDiffusion, position + vec3( 0,  0, uStep.z)).r;
//
//    float laplace = total_left + total_right + total_down + total_up + total_back + total_forward - 6.0 * total_radiance;
//
//    float diffusion = colorSample.a * uScattering * laplace;


//    float derivative = total_convection + diffusion;
//    float eulerRadiance = total_radiance + derivative * uTimeStep;

    // Jacobi relaxation
//    float numerator = convection + diffusion + 4.0 * uScatteringScale * rc;
//    float denominator = uAbsorptionScale * dc + 4.0 * uScatteringScale;
//    float jacobiRadiance = numerator / denominator;
//    float weightedJacobi = mix(rc, jacobiRadiance, uJacobiWeight);

//    oDiffusion = diffusion * uTimeStep;
    oDiffusion = 0.0;
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

float componentSum(in vec4 vector) {
    return vector.r + vector.g + vector.b + vector.a;
}

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

            energyDensity = componentSum(texture(uEnergyDensity, pos));
//            energyDensity = texture(uEnergyDensity, pos).a;
//            energyDensity += texture(uDiffusion, pos).r;

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

// #section FCNDeferredRender/vertex

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

// #section FCNDeferredRender/fragment

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
layout (location = 0) out float oLighting;
layout (location = 1) out vec4 oColor;

//debug
in vec2 vPosition;

@intersectCube

float componentSum(in vec4 vector) {
    return vector.r + vector.g + vector.b + vector.a;
}

void main() {

    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(1.0, 1.0, 1.0, 1.0);
        oLighting = 0.0;
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec3 pos;
        float val;
        vec4 colorSample;
        vec4 accumulator = vec4(0.0);

        float lightingAccumulator = 0.0;
        float lightingSample;
        float energyDensity = 0.0;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).r;

            energyDensity = componentSum(texture(uEnergyDensity, pos));
//            energyDensity = texture(uEnergyDensity, pos).r;
            energyDensity += texture(uDiffusion, pos).r;

            // Color
            colorSample = texture(uTransferFunction, vec2(val, 0.5));
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= colorSample.a; // * energyDensity;

            // Lighting
            lightingSample = 1.0 - energyDensity;
            lightingAccumulator += (1.0 - accumulator.a) * lightingSample * colorSample.a;

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        //        oColor = vec4(accumulator.rgb, 1.0);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
        oLighting = lightingAccumulator;
    }
}

// #section FCNCombineRender/vertex

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

// #section FCNCombineRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;
uniform mediump sampler2D uLighting;
uniform int uSmartDeNoise;
uniform float uSigma;
uniform float uKSigma;
uniform float uTreshold;

out vec4 color;

//debug
in vec2 vPosition;

@smartDeNoiseF

void main() {
    vec4 colorSample = texture(uColor, vPosition);
    float lightingSample;
    if (uSmartDeNoise == 1)
        lightingSample = smartDeNoiseF(uLighting, vPosition, uSigma, uKSigma, uTreshold); // 5.0, 2.0, .100;
    else
        lightingSample = texture(uLighting, vPosition).r;
    color = mix(colorSample, vec4(0, 0, 0, 1), lightingSample);
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

// #section FCNResetLightTexture/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section FCNResetLightTexture/fragment

#version 300 es
precision mediump float;
#define DIRECTIONAL 0.5
#define POINT 1.5

in vec2 vPosition;
uniform mediump sampler3D uEnergyDensity;
uniform mediump sampler3D uDiffusion;

uniform int uNLights;
uniform float uLayer;
uniform vec3 uStep;
uniform vec3 uSize;
uniform vec4 uLights[4];

layout (location = 0) out vec4 oEnergyDensity;
layout (location = 1) out vec4 oDiffusion;

bool lightOutsideVolume(vec3 position) {
    if (any(greaterThan(position, vec3(1.0))) || any(lessThan(position, vec3(0.0)))) {
        return true;
    }
    return false;
}

void main() {
    vec3 position = vec3(vPosition, uLayer);
    vec4 energyDensity = vec4(0.0);
    oDiffusion = vec4(0.0);
    int location = 0;
    if (position.x < uStep.x) {
        location = 1;
    } else if (position.x > 1.0 - uStep.x) {
        location = 2;
    } else if (position.y < uStep.y) {
        location = 3;
    } else if (position.y > 1.0 - uStep.y) {
        location = 4;
    } else if (position.z < uStep.z) {
        location = 5;
    } else if (position.z >  1.0 - uStep.z) {
        location = 6;
    }
    for (int i = 0; i < uNLights; i++) {
        if (uLights[i].a < DIRECTIONAL) {
            if (location == 1 && uLights[i].x > 0.0 ||
            location == 2 && uLights[i].x < 0.0 ||
            location == 3 && uLights[i].y > 0.0 ||
            location == 4 && uLights[i].y < 0.0 ||
            location == 5 && uLights[i].z > 0.0 ||
            location == 6 && uLights[i].z < 0.0) {
                energyDensity[i] = 1.0;
            }
        }
        else {
            if (lightOutsideVolume(vec3(uLights[i]))) {
                if (location == 1 && position.x - uLights[i].x > 0.0 ||
                location == 2 && position.x - uLights[i].x < 0.0 ||
                location == 3 && position.y - uLights[i].y > 0.0 ||
                location == 4 && position.y - uLights[i].y < 0.0 ||
                location == 5 && position.z - uLights[i].z > 0.0 ||
                location == 6 && position.z - uLights[i].z < 0.0) {
                    energyDensity[i] = 1.0;
                }
            } else if (distance(position * uSize, uLights[i].xyz * uSize) <= 2.0) {
                energyDensity[i] = 1.0;
            }
        }
    }
    oEnergyDensity = energyDensity;
}
