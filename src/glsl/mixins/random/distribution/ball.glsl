// #part /glsl/mixins/random/distribution/ball

vec3 random_ball(inout uint state) {
    float z = 1.0 - 2.0 * random_uniform(state);
    float angle = TWOPI * random_uniform(state);
    float radius = pow(random_uniform(state), 1.0 / 3.0);
    float height = sqrt(1.0 - z * z);
    return radius * vec3(height * cos(angle), height * sin(angle), z);
}
