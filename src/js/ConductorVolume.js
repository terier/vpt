import { WebGL } from './WebGL.js';
import { Volume } from './Volume.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class ConductorVolume extends EventTarget {

constructor(gl, reader) {
    super();

    this.gl = gl;

    this.zipReader = reader._zipReader;

    this.dataVolume = new Volume(gl, reader);
    this.idVolume = new Volume(gl, reader);
    this.mask = null;
    this.framebuffer = null;
    this.attributes = null;
    this.groups = [];

    this.clipQuad = WebGL.createClipQuad(gl);
    this.programs = WebGL.buildPrograms(gl, {
        updateMask: SHADERS.updateMask,
    }, MIXINS);
}

destroy() {
    const gl = this._gl;

    this.dataVolume.destroy();
    this.idVolume.destroy();

    if (this.mask) {
        gl.deleteTexture(this.mask);
    }

    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

async load() {
    const { dataVolume, idVolume } = this;

    await Promise.all([
        dataVolume.readModality('data'),
        idVolume.readModality('id'),
    ]);

    dataVolume.setFilter('linear');
    idVolume.setFilter('nearest');

    const dataDim = dataVolume.modality.dimensions;
    const idDim = idVolume.modality.dimensions;

    if (
        dataDim.width !== idDim.width ||
        dataDim.height !== idDim.height ||
        dataDim.depth !== idDim.depth
    ) {
        throw new Error('Data and ID volume dimension mismatch');
    }

    const { width, height, depth } = dataDim;

    const gl = this.gl;
    this.mask = WebGL.createTexture(gl, {
        texture: this.mask,
        target: gl.TEXTURE_3D,

        width, height, depth,

        internalFormat: gl.RG8,
        format: gl.RG,
        type: gl.UNSIGNED_BYTE,

        min: gl.LINEAR,
        mag: gl.LINEAR,

        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        wrapR: gl.CLAMP_TO_EDGE,
    });

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.mask, 0, 0);

    this.maskValues = WebGL.createTexture(gl, {
        internalFormat: gl.RG8,
        format: gl.RG,
        type: gl.UNSIGNED_BYTE,

        width: 1,
        height: 1,

        min: gl.NEAREST,
        mag: gl.NEAREST,

        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
    });

    //this.attributes = await this.zipReader.readFile('attributes.csv');
}

updateMask() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.clipQuad);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    const { program, uniforms } = this.programs.updateMask;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this.idVolume.getTexture());
    gl.uniform1i(uniforms.uIdTexture, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskValues);
    gl.uniform1i(uniforms.uMaskValues, 1);

    const { width, height, depth } = this.idVolume.modality.dimensions;
    gl.viewport(0, 0, width, height);

    for (let layer = 0; layer < depth; layer++) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.mask, 0, layer);
        gl.uniform1f(uniforms.uDepth, (layer + 0.5) / depth);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

maskValue(k, n) {
    if (k === 0) {
        return [0.5, 0.5];
    }

    const angle = ((k - 1) / n) * 2 * Math.PI;
    return [Math.cos(angle), Math.sin(angle)];
}

setFilter(filter) {
    if (!this.mask) {
        return;
    }

    const gl = this.gl;
    filter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.bindTexture(gl.TEXTURE_3D, this.mask);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
}

getTexture() {
    return this.mask;
}

}
