import { WebGL } from './WebGL.js';
import { Volume } from './Volume.js';

export class ConductorVolume extends EventTarget {

constructor(gl, reader) {
    super();

    this.gl = gl;

    this.zipReader = reader._zipReader;

    this.dataVolume = new Volume(gl, reader);
    this.idVolume = new Volume(gl, reader);
    this.mask = null;
    this.attributes = null;
}

async load() {
    const { dataVolume, idVolume } = this;

    await Promise.all([
        dataVolume.readModality('data'),
        idVolume.readModality('id'),
    ]);

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

    //this.attributes = await this.zipReader.readFile('attributes.csv');
}

setFilter(filter) {
    this.dataVolume.setFilter(filter);
    this.idVolume.setFilter(filter);
}

getTexture() {
    return this.mask;
}

}
