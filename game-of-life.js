/**
 * Simple XHR request
 * @type {Object}
 */
var Request = {};

/**
 * HTTP GET
 * @param  {String} file
 * @return {String}      Response
 */
Request.get = function(file) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', file, false);
	xhr.send();
	return xhr.responseText;
};

/**
 * Game of life
 * @param {Number} width
 * @param {Number} height
 */
var Game = function(width, height) {

	// Set size
	this.width = width;
	this.height = height;

	// Create canvas
	this.canvas = document.createElement('canvas');
	document.body.appendChild(this.canvas);
	this.canvas.width = this.width;
	this.canvas.height = this.height;

	// Get WebGL context
	this.context = this.canvas.getContext('webgl');

	var gl = this.context;

	// Create buffer 
	this.buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, 1.0,
		1.0, 1.0
	]), gl.STATIC_DRAW);

	// Set viewport
	gl.viewport(0, 0, this.width, this.height);

	// Initialize logic
	if (!this.initializeLogic()) {
		return false;
	}

	// Initialize display
	if (!this.initializeDisplay()) {
		return false;
	}

	// Run
	this.updateLogic();
	this.updateDisplay();

	return true;

};

/**
 * Initializes game logic
 * @return {Boolean}
 */
Game.prototype.initializeLogic = function() {

	//
	this.logic = {

		state: 0,

		program: null,
		shader: {
			fragment: null,
			vertex: null
		},

		texture: null

	};

	var gl = this.context;

	//
	this.logic.shader.fragment = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.logic.shader.fragment, Request.get('shader/fragment/logic.frag'));
	gl.compileShader(this.logic.shader.fragment);

	//
	if (!gl.getShaderParameter(this.logic.shader.fragment, gl.COMPILE_STATUS ) ) {
		console.error('Unable to compile fragment shader for logic');
		return false;
	}

	//
	this.logic.shader.vertex = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(this.logic.shader.vertex, Request.get('shader/vertex/logic.vert'));
	gl.compileShader(this.logic.shader.vertex);

	//
	if (!gl.getShaderParameter(this.logic.shader.vertex, gl.COMPILE_STATUS ) ) {
		console.error('Unable to compile vertex shader for logic');
		return false;
	}

	//
	this.logic.program = gl.createProgram();
	gl.attachShader(this.logic.program, this.logic.shader.fragment);
	gl.attachShader(this.logic.program, this.logic.shader.vertex);
	gl.linkProgram(this.logic.program);

	//
	if (!gl.getProgramParameter(this.logic.program, gl.LINK_STATUS ) ) {
		console.error('Unable to link program for logic');
		return false;
	}

	//
	this.logic.program.a_position = gl.getAttribLocation(this.logic.program, 'a_position');
	gl.enableVertexAttribArray(this.logic.program.a_position);

	this.logic.program.u_size = gl.getUniformLocation(this.logic.program, 'u_size');
	gl.enableVertexAttribArray(this.logic.program.u_size);

	this.logic.program.u_state = gl.getUniformLocation(this.logic.program, 'u_state');
	gl.enableVertexAttribArray(this.logic.program.u_state);

	this.logic.program.u_texture = gl.getUniformLocation(this.logic.program, 'u_texture');
	gl.enableVertexAttribArray(this.logic.program.u_texture);


	// Populate game with random data
	var data = new Uint8Array(4 * this.width * this.height);
	for(var i = 0; i < data.length; i += 4) {
		if(Math.random() < 0.5) {
			data[i] = 0;
		}
		else {
			data[i] = 255;
		}
	}

	// Create texture for data storage
	this.logic.texture = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.logic.texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	//
	this.logic.framebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.logic.framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.logic.texture, 0);

	//
	gl.useProgram(this.logic.program);
	gl.uniform1i(this.logic.program.u_texture, 0);
	gl.uniform2fv(this.logic.program.u_size, [this.width, this.height]);

	return true;

};

/**
 * Updates game logic
 */
Game.prototype.updateLogic = function() {

	// For simplicity's sake
	var gl = this.context;

	gl.useProgram(this.logic.program);

	// Update to new state
	gl.uniform1i(this.logic.program.u_state, this.logic.state);

	// Swap state
	this.logic.state = 1 - this.logic.state;

	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.vertexAttribPointer(this.logic.program.a_position, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.logic.framebuffer);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// Set timer for next update
	setTimeout(this.updateLogic.bind(this), 16);

};

/**
 * Initializes game display
 * @return {Boolean}
 */
Game.prototype.initializeDisplay = function() {

	this.display = {

		state: 0,

		program: null,
		shader: {
			fragment: null,
			vertex: null
		}

	};

	var gl = this.context;

	//
	this.display.shader.fragment = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.display.shader.fragment, Request.get('shader/fragment/display.frag'));
	gl.compileShader(this.display.shader.fragment);

	//
	if (!gl.getShaderParameter(this.display.shader.fragment, gl.COMPILE_STATUS ) ) {
		console.error('Unable to compile fragment shader for display');
		return false;
	}

	//
	this.display.shader.vertex = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(this.display.shader.vertex, Request.get('shader/vertex/display.vert'));
	gl.compileShader(this.display.shader.vertex);

	//
	if (!gl.getShaderParameter(this.display.shader.vertex, gl.COMPILE_STATUS ) ) {
		console.error('Unable to compile vertex shader for display');
		return false;
	}

	//
	this.display.program = gl.createProgram();
	gl.attachShader(this.display.program, this.display.shader.fragment);
	gl.attachShader(this.display.program, this.display.shader.vertex);
	gl.linkProgram(this.display.program);

	//
	if (!gl.getProgramParameter(this.display.program, gl.LINK_STATUS ) ) {
		console.error('Unable to link program for display');
		return false;
	}

	//
	this.display.program.a_position = gl.getAttribLocation(this.display.program, 'a_position');
	gl.enableVertexAttribArray(this.display.program.a_position);

	this.display.program.u_texture = gl.getUniformLocation(this.display.program, 'u_texture');
	gl.enableVertexAttribArray(this.display.program.u_texture);

	//
	gl.useProgram(this.display.program);
	gl.uniform1i(this.display.program.u_texture, 0);

	return true;

};

/**
 * Updates game display
 */
Game.prototype.updateDisplay = function() {

	var gl = this.context;

	//
	gl.useProgram(this.display.program);

	//
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
	gl.vertexAttribPointer(this.display.program.a_position, 2, gl.FLOAT, gl.FALSE, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	// Request next frame
	requestAnimationFrame(this.updateDisplay.bind(this));

};
