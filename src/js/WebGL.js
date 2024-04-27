export function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const log = gl.getShaderInfoLog(shader);
        const typestring = {
            [gl.VERTEX_SHADER]: 'vertex',
            [gl.FRAGMENT_SHADER]: 'fragment',
        }[type];
        throw new Error(`Cannot compile ${typestring} shader:\n${log}`);
    }
    return shader;
}

export function createProgram(gl, shaders) {
    const program = gl.createProgram();
    for (const shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const log = gl.getProgramInfoLog(program);
        throw new Error(`Cannot link program:\n${log}`);
    }

    const attributes = {};
    const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < activeAttributes; i++) {
        const { name } = gl.getActiveAttrib(program, i);
        attributes[name] = gl.getAttribLocation(program, name);
    }

    function addToObject(object, path, value) {
        const partRegex = /\.?(\w+)(\[(\d+)\])?/g;
        const matches = [...path.matchAll(partRegex)];
        const lastMatch = matches.pop();
        let currentObject = uniforms;
        for (const [, part,, indexstr] of matches) {
            if (indexstr) {
                const index = Number(indexstr);
                currentObject[part] ??= [];
                currentObject = currentObject[part];
                currentObject[index] ??= {};
                currentObject = currentObject[index];
            } else {
                currentObject[part] ??= {};
                currentObject = currentObject[part];
            }
        }
        const [, part,, indexstr] = lastMatch;
        if (indexstr) {
            const index = Number(indexstr);
            currentObject[part] ??= [];
            currentObject = currentObject[part];
            currentObject[index] = value;
        } else {
            currentObject[part] = value;
        }
    }

    const uniforms = {};
    const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < activeUniforms; i++) {
        const { name, size } = gl.getActiveUniform(program, i);
        const isArray = name.endsWith('[0]');
        if (isArray) {
            const arrayName = name.substring(0, name.length - 3);
            for (let k = 0; k < size; k++) {
                const elementName = `${arrayName}[${k}]`;
                addToObject(uniforms, elementName, gl.getUniformLocation(program, elementName));
            }
        } else {
            addToObject(uniforms, name, gl.getUniformLocation(program, name));
        }
    }

    return { program, attributes, uniforms };
}

export function buildPrograms(gl, shaders, mixins) {
    const cooked = {};
    for (const name in shaders) {
        cooked[name] = {};
        const types = shaders[name];
        for (const type in types) {
            cooked[name][type] = types[type].replace(/@(\S+)/g, (_, path) => {
                let struct = mixins;
                for (const part of path.split('/')) {
                    struct = struct[part];
                }
                return struct;
            });
        }
    }

    const programs = {};
    for (const name in cooked) {
        try {
            const program = cooked[name];
            programs[name] = createProgram(gl, [
                createShader(gl, program.vertex, gl.VERTEX_SHADER),
                createShader(gl, program.fragment, gl.FRAGMENT_SHADER),
            ]);
        } catch (e) {
            e.message = `Error compiling and building ${name}:\n${e.message}`;
            throw e;
        }
    }

    return programs;
}

export function createTexture(gl, {
    texture = gl.createTexture(),
    unit,
    target  = gl.TEXTURE_2D,
    level   = 0,
    iformat = gl.RGBA,
    format  = gl.RGBA,
    type    = gl.UNSIGNED_BYTE,
    image, data,
    width, height, depth,
    wrapS, wrapT, wrapR,
    min, mag, mip,
}) {
    if (unit != null) {
        gl.activeTexture(gl.TEXTURE0 + unit);
    }

    gl.bindTexture(target, texture);
    if (image) {
        gl.texImage2D(target, level, iformat, format, type, image);
    } else { // if options.data == null, just allocate
        if (target === gl.TEXTURE_3D) {
            gl.texImage3D(target, level, iformat, width, height, depth, 0, format, type, data);
        } else {
            gl.texImage2D(target, level, iformat, width, height, 0, format, type, data);
        }
    }
    if (wrapS) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrapS); }
    if (wrapT) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapT); }
    if (wrapR) { gl.texParameteri(target, gl.TEXTURE_WRAP_R, wrapR); }
    if (min) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, min); }
    if (mag) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, mag); }
    if (mip) { gl.generateMipmap(target); }

    return texture;
}

export function createFramebuffer(gl, attachments) {
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
        throw new Error(`Cannot create framebuffer: ${status}`);
    }

    return framebuffer;
}

export function createBuffer(gl, {
    buffer = gl.createBuffer(),
    target = gl.ARRAY_BUFFER,
    hint = gl.STATIC_DRAW,
    data,
}) {
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, hint);

    return buffer;
}

export function createSampler(gl, {
    sampler = gl.createSampler(),
    wrapS, wrapT, wrapR,
    min, mag,
}) {
    if (wrapS) { gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, wrapS); }
    if (wrapT) { gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, wrapT); }
    if (wrapR) { gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_R, wrapR); }
    if (min) { gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, min); }
    if (mag) { gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, mag); }

    return sampler;
}

export function configureAttribute(gl, {
    location, count, type,
    normalize = false,
    stride = 0, offset = 0,
    divisor = 0,
}) {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, count, type, normalize, stride, offset);
    gl.vertexAttribDivisor(location, divisor);
}
