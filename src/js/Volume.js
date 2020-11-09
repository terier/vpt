// #package js/main

// #include WebGL.js

class Volume {

constructor(gl, reader, options) {
    Object.assign(this, {
        ready: false
    }, options);

    this._gl = gl;
    this._reader = reader;

    this.meta       = null;
    this.modalities = null;
    this.blocks     = null;
    this._texture   = null;
    this._tfArray   = [];
    for (let i = 0; i < 256*256; i++) {
        this._tfArray[i] = 0;
    }
    this._tfAccumulatedGM = null;
}

destroy() {
    const gl = this._gl;
    if (this._texture) {
        gl.deleteTexture(this._texture);
    }
}

readMetadata(handlers) {
    if (!this._reader) {
        return;
    }
    this.ready = false;
    this._reader.readMetadata({
        onData: data => {
            this.meta = data.meta;
            this.modalities = data.modalities;
            this.blocks = data.blocks;
            handlers.onData && handlers.onData();
        }
    });
}

readModality(modalityName, handlers) {
    if (!this._reader || !this.modalities) {
        return;
    }
    this.ready = false;
    const modality = this.modalities.find(modality => modality.name === modalityName);
    if (!modality) {
        return;
    }

    this._currentModality = modality;
    const dimensions = modality.dimensions;
    const blocks = this.blocks;

    const gl = this._gl;
    if (this._texture) {
        gl.deleteTexture(this._texture);
    }
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this._texture);

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const internalFormat = modality.internalFormat;
    gl.texStorage3D(gl.TEXTURE_3D, 1, internalFormat, dimensions.width, dimensions.height, dimensions.depth);
    let remainingBlocks = modality.placements.length;
    modality.placements.forEach(placement => {
        this._reader.readBlock(placement.index, {
            onData: data => {
                const position = placement.position;
                const block = blocks[placement.index];
                const blockdim = block.dimensions;
                const type = modality.type || gl.UNSIGNED_INT;
                const gpuFormat = modality.format || gl.RED_INTEGER;

                // Accumulate gradient magnitude
                const typedData = this._typize(data, type);
                for (let i = 0; i < typedData.length; i+=2) {
                    this._tfArray[typedData[i+1] * 256 + typedData[i]]++;
                }

                gl.bindTexture(gl.TEXTURE_3D, this._texture);
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                    position.x, position.y, position.z,
                    blockdim.width, blockdim.height, blockdim.depth,
                    gpuFormat, type, typedData);
                remainingBlocks--;
                if (remainingBlocks === 0) {

                    // Create textur of accumulated gradient magnitude
                    const m = Math.log(Math.max(...this._tfArray));

                    let tf = new Array(this._tfArray.length * 4);
                    for (let i = 0; i < this._tfArray.length; i++) {
                        const v = 255 - Math.log(this._tfArray[i]) / m * 255;
                        tf[4 * i] = v;
                        tf[4 * i + 1] = v;
                        tf[4 * i + 2] = v;
                        tf[4 * i + 3] = 255;
                    }
                    this._tfArray = tf;

                    const imgData = new ImageData(Uint8ClampedArray.from(this._tfArray), 256, 256);
                    const canv = document.createElement('canvas');
                    canv.width = 256;
                    canv.height = 256;
                    const ctx = canv.getContext('2d');
                    ctx.putImageData(imgData, 0, 0);
                    this._tfAccumulatedGM = canv.toDataURL();
                    // console.log(this._tfAccumulatedGM);

                    this.ready = true;
                    handlers.onLoad && handlers.onLoad();
                }
            }
        });
    });
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
        return this._texture;
    } else {
        return null;
    }
}

setFilter(filter) {
    if (!this._texture) {
        return;
    }

    var gl = this._gl;
    filter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.bindTexture(gl.TEXTURE_3D, this._texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
}

}
