#version 300 es
precision mediump float;

uniform float uTime;
uniform mediump sampler3D uVolume;

// camera
uniform vec3 uPosition;
uniform vec3 uDirection;
uniform vec3 uUp;
uniform vec3 uRight;
uniform float uFov;
uniform float uAsr;
uniform float uFocalDistance;
uniform float uFocalPerturbation;
uniform float uExposure;

// TODO: interpolate ray direction without perturbation
in vec2 vFragmentPosition;
out vec4 color;

vec2 intersectCube(vec3 origin, vec3 direction) {
    vec3 tmin = (vec3(-1.0, -1.0, -1.0) - origin) / direction;
    vec3 tmax = (vec3( 1.0,  1.0,  1.0) - origin) / direction;
    vec3 t1 = min(tmin, tmax);
    vec3 t2 = max(tmin, tmax);
    float tnear = max(max(t1.x, t1.y), t1.z);
    float tfar = min(min(t2.x, t2.y), t2.z);
    return vec2(tnear, tfar);
}

void main() {
    vec3 origin = uPosition;
    vec3 direction = uDirection + (vFragmentPosition.x * uFov) * uRight + (vFragmentPosition.y * uFov / uAsr) * uUp;
    vec2 t = max(intersectCube(origin, direction), 0.0);
    t.x = min(t.x, t.y);
    float val = 0.0;
    float tt = 0.0;
    do {
      vec3 pos = ((origin + direction * mix(t.x, t.y, tt)) + 1.0) * 0.5;
      val = max(val, texture(uVolume, pos).r);
      tt += 0.02;
    } while (tt < 1.0);
    //color = vec4(1.0 - val, 1.0 - val, 1.0 - val, 1.0);
    color = vec4(val, val, val, 1.0);
}