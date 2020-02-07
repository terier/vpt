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
    const dimensions = modality.dimensions;
    const components = modality.components;
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

    // TODO: here read modality format & number of components, ...
    let format, internalFormat;
    if (components === 2) {
        internalFormat = gl.RG8;
        format = gl.RG;
    } else {
        internalFormat = gl.R8;
        format = gl.RED;
    }
    gl.texStorage3D(gl.TEXTURE_3D, 1, internalFormat, dimensions.width, dimensions.height, dimensions.depth);
    let remainingBlocks = modality.placements.length;
    modality.placements.forEach(placement => {
        this._reader.readBlock(placement.index, {
            onData: data => {
                const position = placement.position;
                const block = blocks[placement.index];
                const blockdim = block.dimensions;
                gl.bindTexture(gl.TEXTURE_3D, this._texture);
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                    position.x, position.y, position.z,
                    blockdim.width, blockdim.height, blockdim.depth,
                    format, gl.UNSIGNED_BYTE, new Uint8Array(data));
                remainingBlocks--;
                if (remainingBlocks === 0) {
                    this.ready = true;
                    handlers.onLoad && handlers.onLoad();
                }
            }
        });
    });
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
