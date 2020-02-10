// #package js/main

class WebGL {

static createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const log = gl.getShaderInfoLog(shader);
        throw new Error('Cannot compile shader\nInfo log:\n' + log);
    }
    return shader;
}

static createProgram(gl, shaders) {
    const program = gl.createProgram();
    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const log = gl.getProgramInfoLog(program);
        throw new Error('Cannot link program\nInfo log:\n' + log);
    }

    let attributes = {};
    const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < activeAttributes; i++) {
        const info = gl.getActiveAttrib(program, i);
        attributes[info.name] = gl.getAttribLocation(program, info.name);
    }

    let uniforms = {};
    const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < activeUniforms; i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attributes, uniforms };
}

static buildPrograms(gl, shaders, mixins) {
    let cooked = {};
    Object.keys(shaders).forEach(function(name) {
        cooked[name] = {};
        const types = shaders[name];
        Object.keys(types).forEach(function(type) {
            cooked[name][type] = types[type].replace(/@([a-zA-Z0-9]+)/g, function(_, mixin) {
                return mixins[mixin];
            });
        });
    });

    let programs = {};
    Object.keys(cooked).forEach(function(name) {
        try {
            var program = cooked[name];
            if (program.vertex && program.fragment) {
                programs[name] = WebGL.createProgram(gl, [
                    WebGL.createShader(gl, program.vertex, gl.VERTEX_SHADER),
                    WebGL.createShader(gl, program.fragment, gl.FRAGMENT_SHADER)
                ]);
            } else if (program.compute) {
                programs[name] = WebGL.createProgram(gl, [
                    WebGL.createShader(gl, program.compute, gl.COMPUTE_SHADER)
                ]);
            }
        } catch (e) {
            throw new Error('Error compiling ' + name + '\n' + e);
        }
    });

    return programs;
}

static createTexture(gl, options) {
    const target = options.target || gl.TEXTURE_2D;
    const internalFormat = options.internalFormat || gl.RGBA;
    const format = options.format || gl.RGBA;
    const type = options.type || gl.UNSIGNED_BYTE;
    const texture = options.texture || gl.createTexture();

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

    return texture;
}

static createFramebuffer(gl, attachments) {
    function attach(attachmentPoint, object) {
        if (object instanceof WebGLTexture) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, object, 0);
        } else if (object instanceof WebGLRenderbuffer) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint, gl.RENDERBUFFER, object);
        }
    }

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    if (attachments.color) {
        for (let i = 0; i < attachments.color.length; i++) {
            attach(gl.COLOR_ATTACHMENT0 + i, attachments.color[i]);
        }
    }
    if (attachments.depth) {
        attach(gl.DEPTH_ATTACHMENT, attachments.depth);
    }
    if (attachments.stencil) {
        attach(gl.STENCIL_ATTACHMENT, attachments.stencil);
    }

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Cannot create framebuffer: ' + status);
    }

    return framebuffer;
}

static createBuffer(gl, options) {
    const target = options.target || gl.ARRAY_BUFFER;
    const hint = options.hint || gl.STATIC_DRAW;
    const buffer = options.buffer || gl.createBuffer();

    gl.bindBuffer(target, buffer);
    gl.bufferData(target, options.data, hint);
    gl.bindBuffer(target, null);

    return buffer;
}

static createUnitQuad(gl) {
    return WebGL.createBuffer(gl, {
        data: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])
    });
}

static createClipQuad(gl) {
    return WebGL.createBuffer(gl, {
        data: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1])
    });
}

}
