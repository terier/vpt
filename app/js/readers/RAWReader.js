//@@../utils/Utils.js
//@@AbstractReader.js

(function(global) {
'use strict';

var Class = global.RAWReader = RAWReader;
CommonUtils.inherit(Class, AbstractReader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RAWReader(loader, options) {
    _.sup.constructor.call(this, loader, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    width  : 0,
    height : 0,
    depth  : 0,
    bits   : 8
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    handlers.onData && handlers.onData({
        meta: {
            version: 1
        },
        modalities: [
            {
                name: 'default',
                dimensions: {
                    width: this.width,
                    height: this.height,
                    depth: this.depth
                },
                transform: {
                    matrix: [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ]
                },
                components: 1,
                bits: this.bits,
                placements: [
                    {
                        index: 0,
                        position: {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    }
                ]
            }
        ],
        blocks: [
            {
                url: 'default',
                format: 'raw',
                dimensions: {
                    width: this.width,
                    height: this.height,
                    depth: this.depth
                }
            }
        ]
    });
};

_.readBlock = function(block, handlers) {
    this._loader.readData(0, this.width * this.height * this.depth * (this.bits / 8), {
        onData: function(data) {
            handlers.onData && handlers.onData(data);
        }
    });
};

// ============================ STATIC METHODS ============================= //

})(this);
