precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_position;

void main() {

	float _ = texture2D(u_texture, v_position).x;
	gl_FragColor = vec4(_, _, _, 1.0);

}