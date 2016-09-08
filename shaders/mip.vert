#version 300 es
precision mediump float;

uniform mat4 uMvpMatrix;

in vec2 aPosition;
out vec4 vRayOrigin;
out vec4 vRayDirection;

void main() {
    vec4 nearPosition = vec4(aPosition, 0.1, 1.0);
    vec4 farPosition = vec4(aPosition, 1.0, 1.0);
    vec4 origin = uMvpMatrix * nearPosition;
    origin /= origin.w;
    vec4 destination = uMvpMatrix * farPosition;
    destination /= destination.w;
    vec4 direction = destination - origin;

    vRayOrigin = origin;
    vRayDirection = direction;
    gl_Position = nearPosition;
}