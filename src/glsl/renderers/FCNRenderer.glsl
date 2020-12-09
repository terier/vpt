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
uniform int uNLights;
uniform float uRatio;
uniform float uLayer;
uniform float uScattering;

in vec2 vPosition;

layout (location = 0) out vec4 oEnergyDensity;
layout (location = 1) out vec4 oDiffusion;

float convection(in float radiance, in float revAbsorption,
                in float left, in float right, in float down, in float up, in float back, in float forward) {

    float newRadiance = 0.0;

    vec3 grad = vec3(
        uLight.x < 0.0 ? right - radiance : radiance - left,
        uLight.y < 0.0 ? up - radiance : radiance - down,
        uLight.z < 0.0 ? forward - radiance : radiance - back
    );
    // (1 - absorption) * (p - 1/2 deltap)
    float convectionDelta = -dot(uLight, grad) * 0.5 / uRatio;

    newRadiance = revAbsorption * (radiance + convectionDelta);
    return newRadiance;
}

float componentSum(in vec4 vector) {
    return vector.r + vector.g + vector.b + vector.a;
}

void main() {
    vec3 position = vec3(vPosition, uLayer);
    vec4 radiance = texture(uEnergyDensity, position);
    if (position.x <= uSize.x || position.y <= uSize.y || position.z < uSize.z ||
    position.x >= 1.0 - uSize.x || position.y >= 1.0 - uSize.y || position.z >=  1.0 - uSize.z) {
        oEnergyDensity = vec4(radiance);
        oDiffusion = vec4(0, 0, 0, 0);
        return;
    }

    float val = texture(uVolume, position).r;
    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));
    float absorption = colorSample.a * uAbsorptionCoefficient;
    float revAbsorption = float(1) - absorption;
//    float newRadiance = 0.0;

    vec4 left      = texture(uEnergyDensity, position + vec3(-uSize.x,  0,  0));
    vec4 right     = texture(uEnergyDensity, position + vec3(uSize.x,  0,  0));
    vec4 down      = texture(uEnergyDensity, position + vec3( 0, -uSize.y,  0));
    vec4 up        = texture(uEnergyDensity, position + vec3( 0,  uSize.y,  0));
    vec4 back      = texture(uEnergyDensity, position + vec3( 0, 0, -uSize.z));
    vec4 forward   = texture(uEnergyDensity, position + vec3( 0,  0, uSize.z));

    vec4 newRadiance = vec4(0);
//    newRadiance[0] = convection(radiance.r, revAbsorption, left.r, right.r, down.r, up.r, back.r, forward.r);

    for (int i = 0; i < uNLights; i++) {
        newRadiance[i] = convection(radiance[i], revAbsorption, left[i], right[i], down[i], up[i], back[i], forward[i]);
    }

    oEnergyDensity = vec4(newRadiance);

//    oEnergyDensity = vec4(radiance, 0, 0, 0);

//    float total_radiance = componentSum(radiance) + texture(uDiffusion, position).r;
//
//    float total_left    = componentSum(left) + texture(uDiffusion, position + vec3(-uSize.x,  0,  0)).r;
//    float total_right   = componentSum(right) + texture(uDiffusion, position + vec3(uSize.x,  0,  0)).r;
//    float total_down    = componentSum(down) + texture(uDiffusion, position + vec3( 0, -uSize.y,  0)).r;
//    float total_up      = componentSum(up) + texture(uDiffusion, position + vec3( 0,  uSize.y,  0)).r;
//    float total_back    = componentSum(back) + texture(uDiffusion, position + vec3( 0, 0, -uSize.z)).r;
//    float total_forward = componentSum(forward) + texture(uDiffusion, position + vec3( 0,  0, uSize.z)).r;
//
//    float laplace = total_left + total_right + total_down + total_up + total_back + total_forward - 6.0 * total_radiance;
//
//    float delta = laplace * total_radiance * uScattering / uRatio;
//    oDiffusion = vec4(delta, 0, 0, 0);

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
