#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform float uAlphaCorrection;
uniform float uSamplingStep;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 color;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        discard;
    }
    float val = 0.0;
    float t = 0.0;
    vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
    vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
    vec3 pos = from;
    vec3 posDelta = (to - from) * uSamplingStep;
    vec4 accumulatedColor = vec4(0.0);
    float accumulatedAlpha = 0.0;
    vec4 colorSample;
    float alphaSample;
    do {
        val = texture(uVolume, pos).r;
        colorSample = texture(uTransferFunction, vec2(val, 0.5));
        alphaSample = colorSample.a * uAlphaCorrection;
        accumulatedColor += (1.0 - accumulatedAlpha) * colorSample * alphaSample;
        accumulatedAlpha += alphaSample;
        pos += posDelta;
        t += uSamplingStep;
    } while (accumulatedAlpha < 0.99 && t < 1.0);
    color = vec4(accumulatedColor.rgb, 1.0);
}
