// #package js/main

// #include WebGL.js

class DoubleBuffer3D {

    constructor(gl, spec) {
        this._gl = gl;
        this._spec = spec;

        this._width = this._spec[0].width;
        this._height = this._spec[0].height;
        this._depth = this._spec[0].depth;

        this._readAttachments = this._createAttachmentsFromSpec(gl, this._spec);
        // this._readFramebuffer = WebGL.createFramebuffer(gl, this._readAttachments);
        this._readFramebuffers = this._createFramebuffers(gl, this._readAttachments);
        this._writeAttachments = this._createAttachmentsFromSpec(gl, this._spec);
        // this._writeFramebuffer = WebGL.createFramebuffer(gl, this._writeAttachments);
        this._writeFramebuffers = this._createFramebuffers(gl, this._writeAttachments);

        // console.log(this._readAttachments)

        console.log(spec)
    }

    destroy() {
        const gl = this._gl;
        for (let framebuffer of this._readFramebuffer) {
            gl.deleteFramebuffer(framebuffer);
        }
        for (let texture of this._readAttachments.color) {
            gl.deleteTexture(texture);
        }
        for (let framebuffer of this._writeFramebuffers) {
            gl.deleteFramebuffer(framebuffer);
        }
        for (let texture of this._writeAttachments.color) {
            gl.deleteTexture(texture);
        }
    }

    _createAttachmentsFromSpec(gl, spec) {
        return { color: spec.map(s => WebGL.createTexture(gl, s)) };
    }

    _createOrAssignTexture(gl, spec) {
        // if (gl.isTexture(spec)) {
        //     return spec;
        // }
        return WebGL.createTexture(gl, spec);
    }

    _createFramebuffers(gl, attachments) {
        let framebuffers = []
        // console.log("depth", this._depth)
        for (let i = 0; i < this._depth; i++) {
            framebuffers[i] = WebGL.createFramebuffer3D(gl, attachments, i);
            // console.log(framebuffers[i])
        }
        return framebuffers;
    }

    use(z = -1) {
        if (z < 0)
            return;
        // console.log(this._writeFramebuffers.length)
        const gl = this._gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeFramebuffers[z]);
        gl.viewport(0, 0, this._width, this._height);
    }

    swap() {
        let tmp = this._readFramebuffers;
        this._readFramebuffers = this._writeFramebuffers;
        this._writeFramebuffers = tmp;

        tmp = this._readAttachments;
        this._readAttachments = this._writeAttachments;
        this._writeAttachments = tmp;
    }

    getAttachments() {
        return this._readAttachments;
    }

    getReadAttachments() {
        return this._readAttachments;
    }

    getWriteAttachments() {
        return this._writeAttachments;
    }

}
