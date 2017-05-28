(function(global) {

/*
 * Receives a canvas and a list of context keys, then tries them
 * one by one to create a context with a specified set of options.
 *
 * Receives:
 *  - HTMLCanvasElement
 *  - Array<String> (context keys, e.g. 'webgl', 'experimental-webgl')
 *  - String (option name) -> * (option value)
 *
 * Returns:
 *  - RenderingContext
 */
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

/*
 * Receives a shader source string and returns a compiled
 * shader object.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (shader source)
 *  - Number (shader type)
 *
 * Returns:
 *  - WebGLShader
 */
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

/*
 * Receives a list of shader objects and returns the linked program
 * with two maps of its active attribute and uniform locations.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - Array<WebGLShader>
 *
 * Returns:
 *  - program:    WebGLProgram
 *  - attributes: String (attribute name) -> WebGLAttributeLocation
 *  - uniforms:   String (uniform name) -> WebGLUniformLocation
 */
function createProgram(gl, shaders) {
    var program = gl.createProgram();
    for (var i = 0; i < shaders.length; i++) {
        gl.attachShader(program, shaders[i]);
    }
    gl.linkProgram(program);
    var status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        var log = gl.getProgramInfoLog(program);
        throw new Error('Cannot link program\nInfo log:\n' + log);
    }
    for (var i = 0; i < shaders.length; i++) {
        gl.deleteShader(shaders[i]);
    }

    var attributes = {};
    var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < activeAttributes; i++) {
        var info = gl.getActiveAttrib(program, i);
        attributes[info.name] = gl.getAttribLocation(program, info.name);
    }

    var uniforms = {};
    var activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
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

/*
 * Receives a map of program sources and mixins and returns a map
 * of linked WebGLProgram objects. This implementation assumes a
 * vertex and a fragment shader for each program.
 * Wherever a '@name' is encountered in a shader, it is replaced with
 * a mixin with the same 'name'.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (program name) -> String (vertex|fragment) -> String (shader source)
 *  - String (mixin name) -> String (mixin source)
 *
 * Returns:
 *  - String (program name) -> WebGLProgram
 */
function compileShaders(gl, shaders, mixins) {
    var cooked = {};
    Object.keys(shaders).forEach(function(name) {
        cooked[name] = {};
        var types = shaders[name];
        Object.keys(types).forEach(function(type) {
            cooked[name][type] = types[type].replace(/@([a-zA-Z0-9]+)/g, function(_, mixin) {
                return mixins[mixin];
            });
        });
    });

    var programs = {};
    Object.keys(cooked).forEach(function(name) {
        try {
            programs[name] = createProgram(gl, [
                createShader(gl, cooked[name].vertex, gl.VERTEX_SHADER),
                createShader(gl, cooked[name].fragment, gl.FRAGMENT_SHADER)
            ]);
        } catch (e) {
            throw new Error('Error compiling ' + name + '\n' + e);
        }
    });

    return programs;
}

/*
 * Receives a set of options and (optionally) some data and creates
 * a texture in the TEXTURE_2D target of the active texture unit.
 * An image can be supplied or a typed array, or data may be missing to
 * just allocate with the given dimensions.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (option name) -> * (option value)
 *     - internalFormat (internal texel format)
 *     - format (texel format)
 *     - type (texel datatype)
 *     - image or data (image, video, canvas, typed array etc.)
 *     - width (only when data is present or both image and data are missing)
 *     - height (only when data is present or both image and data are missing)
 *     - wrapS (texture wrapping mode for the S coordinate)
 *     - wrapT (texture wrapping mode for the T coordinate)
 *     - min (minification filter)
 *     - mag (magnification filter)
 *
 * Returns:
 *  - WebGLTexture
 */
function createTexture(gl, options) {
    var target = options.target || gl.TEXTURE_2D;
    var internalFormat = options.internalFormat || gl.RGBA;
    var format = options.format || gl.RGBA;
    var type = options.type || gl.UNSIGNED_BYTE;
    var texture = gl.createTexture();

    gl.bindTexture(target, texture);
    if (options.image) {
        gl.texImage2D(target, 0, internalFormat, format, type, options.image);
    } else { // if options.data == null, just allocate
        gl.texImage2D(target, 0, internalFormat, options.width, options.height, 0, format, type, options.data);
    }
    if (options.wrapS) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS); }
    if (options.wrapT) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT); }
    if (options.min) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min); }
    if (options.mag) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag); }
    gl.bindTexture(target, null);

    return texture;
}

/*
 * Receives a set of options and dimensions and creates a framebuffer with
 * just a color attachment (without depth and stencil attachments).
 * Useful for e.g. simulating compute shaders.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (option name) -> * (option value)
 *    - texture creation options (see createTexture)
 *    - width
 *    - height
 *
 * Returns:
 *  - framebuffer: WebGLFramebuffer
 *  - texture:     WebGLTexture (color attachment)
 *  - width:       Number
 *  - height:      Number
 */
function createSimpleRenderTarget(gl, options) {
    var texture = createTexture(gl, options);
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
        framebuffer: framebuffer,
        texture: texture,
        width: options.width,
        height: options.height
    };
}

/*
 * Creates a unit quad [(0,0), (1,0), (1,1), (0,1)] with a STATIC_DRAW hint
 * that can be drawn with gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
 *
 * Receives:
 *  - WebGLRenderingContext
 *
 * Returns:
 *  - WebGLBuffer
 */
function createUnitQuad(gl) {
    var buffer = gl.createBuffer();
    var data = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
}

/*
 * Creates a clip quad [(-1,-1), (1,-1), (1,1), (-1,1)] with a STATIC_DRAW hint
 * that can be drawn with gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
 *
 * Receives:
 *  - WebGLRenderingContext
 *
 * Returns:
 *  - WebGLBuffer
 */
function createClipQuad(gl) {
    var buffer = gl.createBuffer();
    var data = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
}

var WebGLUtils = global.WebGLUtils = {
    getContext: getContext,
    createShader: createShader,
    createProgram: createProgram,
    compileShaders: compileShaders,
    createTexture: createTexture,
    createSimpleRenderTarget: createSimpleRenderTarget,
    createUnitQuad: createUnitQuad,
    createClipQuad: createClipQuad
};

})(this);
