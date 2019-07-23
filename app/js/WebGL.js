var WebGL = (function() {
'use strict';

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
        program    : program,
        attributes : attributes,
        uniforms   : uniforms
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
function buildPrograms(gl, shaders, mixins) {
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
 * a texture in the specified target of the specified texture unit.
 * An image can be supplied or a typed array, or data may be missing to
 * just allocate with the given dimensions.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (option name) -> * (option value)
 *     - target (binding target)
 *     - unit (integer, texturing unit index)
 *     - internalFormat (internal texel format)
 *     - format (texel format)
 *     - type (texel datatype)
 *     - image or data (image, video, canvas, typed array etc.)
 *     - texture (optional existing texture object)
 *     - width (only when data is present or both image and data are missing)
 *     - height (only when data is present or both image and data are missing)
 *     - wrapS (texture wrapping mode for the S coordinate)
 *     - wrapT (texture wrapping mode for the T coordinate)
 *     - min (minification filter)
 *     - mag (magnification filter)
 *     - mip (generate mipmaps)
 *
 * Returns:
 *  - WebGLTexture
 */
function createTexture(gl, options) {
    var target = options.target || gl.TEXTURE_2D;
    var internalFormat = options.internalFormat || gl.RGBA;
    var format = options.format || gl.RGBA;
    var type = options.type || gl.UNSIGNED_BYTE;
    var texture = options.texture || gl.createTexture();

    if (options.unit) {
        gl.activeTexture(gl.TEXTURE0 + options.unit);
    }
    gl.bindTexture(target, texture);
    if (options.image) {
        gl.texImage2D(target, 0, internalFormat, format, type, options.image);
    } else { // if options.data == null, just allocate
        if (target === gl.TEXTURE_3D) {
            gl.texImage3D(target, 0, internalFormat, options.width, options.height, options.depth, 0, format, type, options.data);
        } else {
            gl.texImage2D(target, 0, internalFormat, options.width, options.height, 0, format, type, options.data);
        }
    }
    if (options.wrapS) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS); }
    if (options.wrapT) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT); }
    if (options.wrapR) { gl.texParameteri(target, gl.TEXTURE_WRAP_R, options.wrapR); }
    if (options.min) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min); }
    if (options.mag) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag); }
    if (options.mip) { gl.generateMipmap(target); }
    gl.bindTexture(target, null);

    return texture;
}

/*
 * Receives a set of attachments and creates a framebuffer.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (option name) -> * (option value)
 *    - color: Array<WebGLTexture|WebGLRenderbuffer>
 *    - depth: WebGLTexture|WebGLRenderbuffer
 *    - stencil: WebGLTexture|WebGLRenderbuffer
 *
 * Returns:
 *  - WebGLFramebuffer
 */
function createFramebuffer(gl, attachments) {
    function attach(attachmentPoint, object) {
        if (object instanceof WebGLTexture) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, object, 0);
        } else if (object instanceof WebGLRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint, gl.RENDERBUFFER, object);
        }
    }

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    if (attachments.color) {
        for (var i = 0; i < attachments.color.length; i++) {
            attach(gl.COLOR_ATTACHMENT0 + i, attachments.color[i]);
        }
    }
    if (attachments.depth) {
        attach(gl.DEPTH_ATTACHMENT, attachments.depth);
    }
    if (attachments.stencil) {
        attach(gl.STENCIL_ATTACHMENT, attachments.stencil);
    }

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Cannot create framebuffer: ' + status);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return framebuffer;
}

/*
 * Receives a set of options and data and creates
 * a buffer with the specified data.
 *
 * Receives:
 *  - WebGLRenderingContext
 *  - String (option name) -> * (option value)
 *     - data (typed array)
 *     - buffer (optional existing buffer object)
 *     - target (binding target)
 *     - hint (data storage hint)
 *
 * Returns:
 *  - WebGLBuffer
 */
function createBuffer(gl, options) {
    var target = options.target || gl.ARRAY_BUFFER;
    var hint = options.hint || gl.STATIC_DRAW;
    var buffer = options.buffer || gl.createBuffer();

    gl.bindBuffer(target, buffer);
    gl.bufferData(target, options.data, hint);
    gl.bindBuffer(target, null);

    return buffer;
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
    return createBuffer(gl, {
        data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])
    });
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
    return createBuffer(gl, {
        data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1])
    });
}

return {
    getContext        : getContext,
    createShader      : createShader,
    createProgram     : createProgram,
    buildPrograms     : buildPrograms,
    createTexture     : createTexture,
    createFramebuffer : createFramebuffer,
    createBuffer      : createBuffer,
    createUnitQuad    : createUnitQuad,
    createClipQuad    : createClipQuad
};

})();
