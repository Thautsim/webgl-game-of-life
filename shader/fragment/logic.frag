precision mediump float;

uniform vec2 u_size;
uniform sampler2D u_texture;
uniform int u_state;

float get(vec2 position) {

	vec4 _ = texture2D(u_texture, (gl_FragCoord.xy + position) / u_size);
	if (u_state == 0) {
		return _.x;
	}
	else {
		return _.y;
	}

}

void main() {

	// Sum neighbor cell states
	float sum = get(vec2(-1.0, -1.0)) + get(vec2(0.0, -1.0)) + get(vec2(1.0, -1.0)) +
				get(vec2(-1.0, 0.0)) + get(vec2(1.0, 0.0)) +
				get(vec2(-1.0, 1.0)) + get(vec2(0.0, 1.0)) + get(vec2(1.0, 1.0));

	// Get cell state
	float last = get(vec2(0.0, 0.0));

	// Set current cell state
	float current = 0.0;
	if ((last == 0.0 && sum == 3.0) || (last == 1.0 && (sum == 2.0 || sum == 3.0))) {
		current = 1.0;
	}

	// Update cell state
	if (u_state == 0) {
		gl_FragColor = vec4(last, current, 0.0, 1.0);
	}
	else {
		gl_FragColor = vec4(current, last, 0.0, 1.0);
	}

}