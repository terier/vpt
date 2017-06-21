var TransferFunctionWidget = (function() {
'use strict';

function TransferFunctionWidget(container, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);

    this._$html = null;
    this._canvas = null;
    this._gl = null;
    this._clipQuad = null;
    this._program = null;

    this._bumps = null;
    this._bumpHandles = null;

    this._width = this._opts.width;
    this._height = this._opts.height;
    this._transferFunctionWidth = this._opts.transferFunctionWidth;
    this._transferFunctionHeight = this._opts.transferFunctionHeight;
    this._nBumps = this._opts.nBumps;

    this._init();
}

TransferFunctionWidget.defaults = {
    width: 256,
    height: 256,
    transferFunctionWidth: 256,
    transferFunctionHeight: 256,
    nBumps: 16
};

var _ = TransferFunctionWidget.prototype;

_._init = function() {
    this._$html = $(TEMPLATES['TransferFunctionWidget.html']);
    this._$container.append(this._$html);
    this._canvas = this._$html.find('canvas').get(0);
    this._canvas.width = this._transferFunctionWidth;
    this._canvas.height = this._transferFunctionHeight;
    this.resize(this._width, this._height);
    this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true
    });
    var gl = this._gl;
    this._clipQuad = WebGLUtils.createClipQuad(gl);
    this._program = WebGLUtils.compileShaders(gl, {
        drawTransferFunction: SHADERS.drawTransferFunction
    }, {
        NBUMPS: this._nBumps
    }).drawTransferFunction;

    var program = this._program;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(program.attributes.aPosition);
    gl.vertexAttribPointer(program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    this._bumps = [];
    for (var i = 0; i < this._nBumps; i++) {
        this._bumps[i] = {
            position: {
                x: Math.random(),
                y: Math.random()
            },
            size: {
                x: Math.random() * 0.5,
                y: Math.random() * 0.5
            },
            color: {
                r: Math.random(),
                g: Math.random(),
                b: Math.random(),
                a: Math.random()
            }
        };
        var $handle = $(TEMPLATES['TransferFunctionWidgetBumpHandle.html']);
        $handle.data('index', i);
        this._$html.append($handle);
        var left = (this._bumps[i].position.x * this._width - 5) + 'px';
        var top = ((1 - this._bumps[i].position.y) * this._height - 5) + 'px';
        $handle.css({
            left: left,
            top: top
        });
        $handle.draggable({
            drag: function(e, ui) {
                var x = (ui.position.left + 5) / this._width;
                var y = 1 - (ui.position.top + 5) / this._height;
                var i = parseInt($(e.target).data('index'), 10);
                this._bumps[i].position.x = x;
                this._bumps[i].position.y = y;
                this.render();
            }.bind(this)
        });
    }
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._program);
    this._$html.remove();
};

_.resize = function(width, height) {
    this._canvas.style.width = width + 'px';
    this._canvas.style.height = height + 'px';
    this._width = width;
    this._height = height;
};

_.resizeTransferFunction = function(width, height) {
    this._canvas.width = width;
    this._canvas.height = height;
    this._transferFunctionWidth = width;
    this._transferFunctionHeight = height;
    var gl = this._gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
};

_.render = function() {
    var gl = this._gl;
    var program = this._program;

    for (var i = 0; i < this._nBumps; i++) {
        var bump = this._bumps[i];
        gl.uniform2f(program.uniforms['uBumps[' + i + '].position'], bump.position.x, bump.position.y);
        gl.uniform2f(program.uniforms['uBumps[' + i + '].size'], bump.size.x, bump.size.y);
        gl.uniform4f(program.uniforms['uBumps[' + i + '].color'], bump.color.r, bump.color.g, bump.color.b, bump.color.a);
    }

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._createBumpHandle = function() {
    var $handle = $(TEMPLATES['TransferFunctionWidgetBumpHandle.html']);
    this._$html.append($handle);
    return $handle;
};

return TransferFunctionWidget;

})();
