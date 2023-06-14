import { WebGL } from './WebGL.js';

export class Volume extends EventTarget {

constructor(gl, reader, options = {}) {
    super();

    this._gl = gl;
    this._reader = reader;

    this.metadata = null;
    this.ready = false;
    this.texture = null;
    this.modality = null;
}

destroy() {
    const gl = this._gl;
    if (this.texture) {
        gl.deleteTexture(this.texture);
    }
}

async readMetadata() {
    if (!this.metadata) {
        this.metadata = await this._reader.readMetadata();
    }
    return this.metadata;
}

async readModality(modalityName) {
    this.ready = false;

    if (!this.metadata) {
        await this.readMetadata();
    }

    const modality = this.metadata.modalities.find(modality => modality.name === modalityName);
    if (!modality) {
        throw new Error(`Modality '${modalityName}' does not exist`);
    }

    this.modality = modality;

    const gl = this._gl;
    if (this.texture) {
        gl.deleteTexture(this.texture);
    }
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this.texture);

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const { width, height, depth } = modality.dimensions;
    const { format, internalFormat, type } = modality;
    gl.texStorage3D(gl.TEXTURE_3D, 1, internalFormat, width, height, depth);


    for (const { index, position } of modality.placements) {
        const data = await this._reader.readBlock(index);
        const block = this.metadata.blocks[index];
        const { width, height, depth } = block.dimensions;
        const { x, y, z } = position;
        gl.bindTexture(gl.TEXTURE_3D, this.texture);
        gl.texSubImage3D(gl.TEXTURE_3D, 0,
            x, y, z, width, height, depth,
            format, type, this._typize(data, type));

        const progress = (index + 1) / modality.placements.length;
        this.dispatchEvent(new CustomEvent('progress', { detail: progress }));
    }

    this.ready = true;
}

async load() {
    await this.readModality('default');
}

_typize(data, type) {
    const gl = this._gl;
    switch (type) {
        case gl.BYTE:                         return new Int8Array(data);
        case gl.UNSIGNED_BYTE:                return new Uint8Array(data);
        case gl.UNSIGNED_BYTE:                return new Uint8ClampedArray(data);
        case gl.SHORT:                        return new Int16Array(data);
        case gl.UNSIGNED_SHORT:               return new Uint16Array(data);
        case gl.UNSIGNED_SHORT_5_6_5:         return new Uint16Array(data);
        case gl.UNSIGNED_SHORT_5_5_5_1:       return new Uint16Array(data);
        case gl.UNSIGNED_SHORT_4_4_4_4:       return new Uint16Array(data);
        case gl.INT:                          return new Int32Array(data);
        case gl.UNSIGNED_INT:                 return new Uint32Array(data);
        case gl.UNSIGNED_INT_5_9_9_9_REV:     return new Uint32Array(data);
        case gl.UNSIGNED_INT_2_10_10_10_REV:  return new Uint32Array(data);
        case gl.UNSIGNED_INT_10F_11F_11F_REV: return new Uint32Array(data);
        case gl.UNSIGNED_INT_24_8:            return new Uint32Array(data);
        case gl.HALF_FLOAT:                   return new Uint16Array(data);
        case gl.FLOAT:                        return new Float32Array(data);
        default: throw new Error('Unknown volume datatype: ' + type);
    }
}

getTexture() {
    if (this.ready) {
        return this.texture;
    } else {
        return null;
    }
}

setFilter(filter) {
    if (!this.texture) {
        return;
    }

    const gl = this._gl;
    filter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.bindTexture(gl.TEXTURE_3D, this.texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
}

}
