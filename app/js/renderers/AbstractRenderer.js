//@@../utils/Utils.js
//@@../WebGLUtils.js
//@@../SingleBuffer.js
//@@../DoubleBuffer.js
//@@../math/Matrix.js

(function(global) {
'use strict';

var Class = global.AbstractRenderer = AbstractRenderer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function AbstractRenderer(gl, volumeTexture, environmentTexture, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._volumeTexture = volumeTexture;
    this._environmentTexture = environmentTexture;

    _._init.call(this);
};

Class.defaults = {
    _bufferSize : 512
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._frameBuffer        = null;
    this._accumulationBuffer = null;
    this._renderBuffer       = null;
    this._transferFunction   = null;
    this._mvpInverseMatrix   = null;
    this._clipQuad           = null;
    this._clipQuadProgram    = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;

    this._frameBuffer = new SingleBuffer(gl, this._getFrameBufferOptions());
    this._accumulationBuffer = new DoubleBuffer(gl, this._getAccumulationBufferOptions());
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferOptions());

    this._transferFunction = WebGLUtils.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    this._mvpInverseMatrix = new Matrix();

    this._clipQuad = WebGLUtils.createClipQuad(gl);
    this._clipQuadProgram = WebGLUtils.compileShaders(gl, {
        quad: SHADERS.quad
    }).quad;
};

_.destroy = function() {
    var gl = this._gl;
    this._frameBuffer.destroy();
    this._accumulationBuffer.destroy();
    this._renderBuffer.destroy();
    gl.deleteTexture(this._transferFunction);
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._clipQuadProgram.program);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.render = function() {
    // TODO: put the following logic in VAO
    var gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._frameBuffer.use();
    this._generateFrame();

    this._accumulationBuffer.use();
    this._integrateFrame();
    this._accumulationBuffer.swap();

    this._renderBuffer.use();
    this._renderFrame();
};

_.reset = function() {
    // TODO: put the following logic in VAO
    var gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._accumulationBuffer.use();
    this._resetFrame();
    this._accumulationBuffer.swap();
};

_.setTransferFunction = function(transferFunction) {
    var gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

_.getTexture = function() {
    return this._renderBuffer.getTexture();
};

_.setMvpInverseMatrix = function(matrix) {
    this._mvpInverseMatrix.copy(matrix);
};

_._resetFrame = function() {
    throw Util.noimpl;
};

_._generateFrame = function() {
    throw Util.noimpl;
};

_._integrateFrame = function() {
    throw Util.noimpl;
};

_._renderFrame = function() {
    throw Util.noimpl;
};

_._getFrameBufferOptions = function() {
    throw Util.noimpl;
};

_._getAccumulationBufferOptions = function() {
    throw Util.noimpl;
};

_._getRenderBufferOptions = function() {
    var gl = this._gl;
    return {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
