var SingleBuffer = (function() {
'use strict';

function SingleBuffer(gl, options) {
    this._gl = gl;
    this._target = WebGLUtils.createSimpleRenderTarget(gl, options);
}

var _ = SingleBuffer.prototype;

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._target.texture);
    gl.deleteFramebuffer(this._target.framebuffer);
};

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._target.framebuffer);
    gl.viewport(0, 0, this._target.width, this._target.height);
};

_.getTexture = function() {
    return this._target.texture;
};

return SingleBuffer;

})();
