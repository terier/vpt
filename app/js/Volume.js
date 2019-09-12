//@@WebGL.js

(function(global) {
'use strict';

var Class = global.Volume = Volume;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Volume(gl, reader, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._reader = reader;

    _._init.call(this);
};

Class.defaults = {
    ready: false
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this.meta       = null;
    this.modalities = null;
    this.blocks     = null;
    this._texture   = null;
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    if (!this._reader) {
        return;
    }
    this.ready = false;
    this._reader.readMetadata({
        onData: function(data) {
            this.meta = data.meta;
            this.modalities = data.modalities;
            this.blocks = data.blocks;
            handlers.onData && handlers.onData();
        }.bind(this)
    });
};

_.readModality = function(modalityName, handlers) {
    if (!this._reader || !this.modalities) {
        return;
    }
    this.ready = false;
    var modality = this.modalities.find(function(modality) {
        return modality.name === modalityName;
    });
    if (modality) {
        var dimensions = modality.dimensions;
        var components = modality.components;
        var blocks = this.blocks;

        var gl = this._gl;
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
        if (components === 2) {
            var internalFormat = gl.RG8;
            var format = gl.RG;
        } else {
            var internalFormat = gl.R8;
            var format = gl.RED;
        }
        gl.texStorage3D(gl.TEXTURE_3D, 1, internalFormat, dimensions.width, dimensions.height, dimensions.depth);
        var remainingBlocks = modality.placements.length;
        modality.placements.forEach(function(placement) {
            this._reader.readBlock(placement.index, {
                onData: function(data) {
                    var position = placement.position;
                    var block = blocks[placement.index];
                    var blockdim = block.dimensions;
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
                }.bind(this)
            });
        }, this);
    }
};

_.getTexture = function() {
    if (this.ready) {
        return this._texture;
    } else {
        return null;
    }
};

_.setFilter = function(filter) {
    if (!this._texture) {
        return;
    }

    var gl = this._gl;
    filter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
    gl.bindTexture(gl.TEXTURE_3D, this._texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, filter);
};

// ============================ STATIC METHODS ============================= //

})(this);
