(function(global) {
'use strict';

var Class = global.TransferFunctionWidget = TransferFunctionWidget;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function TransferFunctionWidget(container, options) {
    $.extend(this, Class.defaults, options);

    this._$container = $(container);

    _._init.call(this);
};

Class.defaults = {
    _width                  : 256,
    _height                 : 256,
    _transferFunctionWidth  : 256,
    _transferFunctionHeight : 256
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html    = null;
    this._canvas   = null;
    this._gl       = null;
    this._clipQuad = null;
    this._program  = null;
    this._bumps    = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['TransferFunctionWidget.html']);
    this._$container.append(this._$html);
    this._canvas = this._$html.find('canvas').get(0);
    this._canvas.width = this._transferFunctionWidth;
    this._canvas.height = this._transferFunctionHeight;
    this.resize(this._width, this._height);

    this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
        depth                 : false,
        stencil               : false,
        antialias             : false,
        preserveDrawingBuffer : true
    });
    var gl = this._gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this._clipQuad = WebGLUtils.createClipQuad(gl);
    this._program = WebGLUtils.compileShaders(gl, {
        drawTransferFunction: SHADERS.drawTransferFunction
    }, MIXINS).drawTransferFunction;
    var program = this._program;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(program.attributes.aPosition);
    gl.vertexAttribPointer(program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    this._bumps = [];

    var addBumpButton = this._$html.find('[name="add-bump"]');
    addBumpButton.click(function() {
        this.addBump();
    }.bind(this));
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._program.program);
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

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

    gl.clear(gl.COLOR_BUFFER_BIT);
    this._bumps.forEach(function(bump) {
        gl.uniform2f(program.uniforms['uPosition'], bump.position.x, bump.position.y);
        gl.uniform2f(program.uniforms['uSize'], bump.size.x, bump.size.y);
        gl.uniform4f(program.uniforms['uColor'], bump.color.r, bump.color.g, bump.color.b, bump.color.a);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    });
};

_.addBump = function(options) {
    var $handle = $(TEMPLATES['TransferFunctionWidgetBumpHandle.html']);
    var bumpIndex = this._bumps.length;
    this._$html.find('.widget').append($handle);
    $handle.data('index', bumpIndex);
    var newBump = {
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
    this._bumps.push(newBump);

    var left = (newBump.position.x * this._width) + 'px';
    var top = ((1 - newBump.position.y) * this._height) + 'px';
    $handle.css({
        left: left,
        top: top
    });
    $handle.draggable({
        handle: $handle.find('.bump-handle'),
        drag: function(e, ui) {
            var x = ui.position.left / this._width;
            var y = 1 - ui.position.top / this._height;
            var i = parseInt($(e.target).data('index'), 10);
            this._bumps[i].position.x = x;
            this._bumps[i].position.y = y;
            this.render();
        }.bind(this)
    });

    this.selectBump(bumpIndex);
    this.render();
};

_.selectBump = function(index) {
    var handles = this._$html.find('.bump');
    var correctHandle = handles.eq(index);
    handles.removeClass('selected');
    correctHandle.addClass('selected');
};

// ============================ STATIC METHODS ============================= //

})(this);
