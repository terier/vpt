//@@WebGL.js

(function(global) {
'use strict';

var Class = global.SingleBuffer = SingleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function SingleBuffer(gl, spec, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._spec = spec;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._framebuffer = null;
    this._attachments = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;
    this._attachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._framebuffer = WebGL.createFramebuffer(gl, this._attachments);

    this._width = this._spec[0].width;
    this._height = this._spec[0].height;
};

_.destroy = function() {
    var gl = this._gl;

    this._deleteAttachments(gl, this._attachments);
    gl.deleteFramebuffer(this._framebuffer);

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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
    gl.viewport(0, 0, this._width, this._height);
};

_.getAttachments = function() {
    return this._attachments;
};

// ============================ STATIC METHODS ============================= //

})(this);
