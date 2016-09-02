#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vFragmentPosition;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
	vFragmentPosition = aPosition;
}