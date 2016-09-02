(function(global) {

var WebGLUtils = global.WebGLUtils = {};

WebGLUtils.getContext = getContext;
function getContext(canvas, keys, options) {
    var context;
    for (var i = 0; i < keys.length; i++) {
        try {
            context = canvas.getContext(keys[i], options);
        } catch (e) {
        }
        if (context) {
            return context;
        }
    }
    throw new Error('Cannot create WebGL context');
}

WebGLUtils.createShader = createShader;
function createShader(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        var log = gl.getShaderInfoLog(shader);
        throw new Error('Cannot compile shader\nInfo log:\n' + log);
    }
    return shader;
}

WebGLUtils.createProgram = createProgram;
function createProgram(gl, shaders) {
    var program = gl.createProgram();
    for (var i = 0; i < shaders.length; i++) {
        gl.attachShader(program, shaders[i]);
    }
    gl.linkProgram(program);
    var status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        var log = gl.getProgramInfoLog(program)
        throw new Error('Cannot link program\nInfo log:\n' + log);
    }
    for (var i = 0; i < shaders.length; i++) {
        gl.deleteShader(shaders[i]);
    }
    var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    var attributes = {};
    for (var i = 0; i < activeAttributes; i++) {
        var info = gl.getActiveAttrib(program, i);
        attributes[info.name] = gl.getAttribLocation(program, info.name);
    }
    var activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    var uniforms = {};
    for (var i = 0; i < activeUniforms; i++) {
        var info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return {
        program: program,
        attributes: attributes,
        uniforms: uniforms
    };
}

})(this);