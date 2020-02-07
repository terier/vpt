// #package glsl/mixins

// #section intersectCube

vec2 intersectCube(in vec3 origin, in vec3 direction) {
    vec3 tmin = (vec3(0.0) - origin) / direction;
    vec3 tmax = (vec3(1.0) - origin) / direction;
    vec3 t1 = min(tmin, tmax);
    vec3 t2 = max(tmin, tmax);
    float tnear = max(max(t1.x, t1.y), t1.z);
    float tfar = min(min(t2.x, t2.y), t2.z);
    return vec2(tnear, tfar);
}
