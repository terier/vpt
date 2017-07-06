#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

@intersectCube

void main() {
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
        float alphaSample;
        vec4 accumulatedColor = vec4(0.0);
        float accumulatedAlpha = 0.0;

        do {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).r;
            colorSample = texture(uTransferFunction, vec2(val, 0.5));
            alphaSample = colorSample.a * rayStepLength * uAlphaCorrection;
            accumulatedColor += (1.0 - accumulatedAlpha) * colorSample * alphaSample;
            accumulatedAlpha += alphaSample;
            t += uStepSize;
        } while (t < 1.0 && accumulatedAlpha < 0.99);

        oColor = vec4(accumulatedColor.rgb, 1.0);
    }
}
