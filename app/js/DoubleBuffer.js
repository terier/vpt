//@@WebGL.js

(function(global) {
'use strict';

var Class = global.DoubleBuffer = DoubleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function DoubleBuffer(gl, spec, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._spec = spec;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._readFramebuffer = null;
    this._readAttachments = null;
    this._writeFramebuffer = null;
    this._writeAttachments = null;
}

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;
    this._readAttachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._readFramebuffer = WebGL.createFramebuffer(gl, this._readAttachments);
    this._writeAttachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._writeFramebuffer = WebGL.createFramebuffer(gl, this._writeAttachments);

    this._width = this._spec[0].width;
    this._height = this._spec[0].height;
};

_.destroy = function() {
    var gl = this._gl;
    this._deleteAttachments(gl, this._readAttachments);
    gl.deleteFramebuffer(this._readFramebuffer);
    this._deleteAttachments(gl, this._writeAttachments);
    gl.deleteFramebuffer(this._writeFramebuffer);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._createAttachmentsFromSpec = function(gl, spec) {
    return {
        color: spec.map(function(spec) {
            return WebGL.createTexture(gl, spec);
        })
    };
};

_._deleteAttachments = function(gl, attachments) {
    attachments.color.forEach(function(attachment) {
        gl.deleteTexture(attachment);
    });
};

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeFramebuffer);
    gl.viewport(0, 0, this._width, this._height);
};

_.swap = function() {
    var tmp = this._readFramebuffer;
    this._readFramebuffer = this._writeFramebuffer;
    this._writeFramebuffer = tmp;

    tmp = this._readAttachments;
    this._readAttachments = this._writeAttachments;
    this._writeAttachments = tmp;
};

_.getAttachments = function() {
    return this._readAttachments;
};

_.getReadAttachments = function() {
    return this._readAttachments;
};

_.getWriteAttachments = function() {
    return this._writeAttachments;
};

// ============================ STATIC METHODS ============================= //

})(this);
