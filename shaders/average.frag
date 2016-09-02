#version 300 es
precision mediump float;

uniform mediump sampler2D uTextureAccumulator;
uniform mediump sampler2D uTextureNew;
uniform float uInvn; // inverse number of samples

in vec2 vFragmentPosition;
out vec4 color;

void main() {
	vec4 a = texture(uTextureAccumulator, vFragmentPosition);
	vec4 b = texture(uTextureNew, vFragmentPosition);
	color = a + (b - a) * uInvn;
}