//@@utils/Utils.js
//@@WebGL.js

(function(global) {
'use strict';

var Class = global.TransferFunctionWidget = TransferFunctionWidget;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function TransferFunctionWidget(container, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);

    this._onColorChange = this._onColorChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
    _width                  : 256,
    _height                 : 256,
    _transferFunctionWidth  : 256,
    _transferFunctionHeight : 256,
    scaleSpeed              : 0.003,
    onChange                : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html          = null;
    this._$colorPicker   = null;
    this._$alphaPicker   = null;
    this._$addBumpButton = null;
    this._$loadButton    = null;
    this._$saveButton    = null;
    this._canvas         = null;
    this._gl             = null;
    this._clipQuad       = null;
    this._program        = null;
    this._bumps          = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['TransferFunctionWidget.html']);
    this._$colorPicker = this._$html.find('[name="color"]');
    this._$alphaPicker = this._$html.find('[name="alpha"]');
    this._$addBumpButton = this._$html.find('[name="add-bump"]');
    this._$loadButton = this._$html.find('[name="load"]');
    this._$saveButton = this._$html.find('[name="save"]');

    this._$container.append(this._$html);
    this._canvas = this._$html.find('canvas').get(0);
    this._canvas.width = this._transferFunctionWidth;
    this._canvas.height = this._transferFunctionHeight;
    this.resize(this._width, this._height);

    this._gl = WebGL.getContext(this._canvas, ['webgl2'], {
        depth                 : false,
        stencil               : false,
        antialias             : false,
        preserveDrawingBuffer : true
    });
    var gl = this._gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this._clipQuad = WebGL.createClipQuad(gl);
    this._program = WebGL.buildPrograms(gl, {
        drawTransferFunction: SHADERS.drawTransferFunction
    }, MIXINS).drawTransferFunction;
    var program = this._program;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(program.attributes.aPosition);
    gl.vertexAttribPointer(program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    this._bumps = [];
    this._$addBumpButton.click(function() {
        this.addBump();
    }.bind(this));

    this._$colorPicker.change(this._onColorChange);
    this._$alphaPicker.change(this._onColorChange);

    this._$loadButton.click(function() {
        CommonUtils.readTextFile(function(data) {
            this._bumps = JSON.parse(data);
            this.render();
            this._rebuildHandles();
            this.onChange && this.onChange();
        }.bind(this));
    }.bind(this));

    this._$saveButton.click(function() {
        CommonUtils.downloadJSON(this._bumps, 'TransferFunction.json');
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
    var bumpIndex = this._bumps.length;
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
    this._addHandle(bumpIndex);
    this.selectBump(bumpIndex);
    this.render();
    this.onChange && this.onChange();
};

_._addHandle = function(index) {
    var $handle = $(TEMPLATES['TransferFunctionWidgetBumpHandle.html']);
    this._$html.find('.widget').append($handle);
    DOMUtils.data($handle.get(0), 'index', index);

    var left = (this._bumps[index].position.x * this._width) + 'px';
    var top = ((1 - this._bumps[index].position.y) * this._height) + 'px';
    $handle.css({
        left: left,
        top: top
    });
    $handle.draggable({
        handle: $handle.find('.bump-handle'),
        drag: function(e, ui) {
            var x = ui.position.left / this._width;
            var y = 1 - ui.position.top / this._height;
            var i = parseInt(DOMUtils.data(e.target, 'index'), 10);
            this._bumps[i].position.x = x;
            this._bumps[i].position.y = y;
            this.render();
            this.onChange && this.onChange();
        }.bind(this)
    });
    $handle.mousedown(function(e) {
        var i = parseInt(DOMUtils.data(e.currentTarget, 'index'), 10);
        this.selectBump(i);
    }.bind(this));
    $handle.on('mousewheel', function(e) {
        var amount = e.originalEvent.deltaY * this.scaleSpeed;
        var scale = Math.exp(-amount);
        var i = parseInt(DOMUtils.data(e.currentTarget, 'index'), 10);
        this.selectBump(i);
        if (e.shiftKey) {
            this._bumps[i].size.y *= scale;
        } else {
            this._bumps[i].size.x *= scale;
        }
        this.render();
        this.onChange && this.onChange();
    }.bind(this));
};

_._rebuildHandles = function() {
    this._$html.find('.bump').remove();
    for (var i = 0; i < this._bumps.length; i++) {
        this._addHandle(i);
    }
};

_.selectBump = function(index) {
    var handles = this._$html.find('.bump');
    var correctHandle = handles.filter('[data-index="' + index + '"]');
    handles.removeClass('selected');
    correctHandle.addClass('selected');

    var color = this._bumps[index].color;
    this._$colorPicker.val(CommonUtils.rgb2hex(color.r, color.g, color.b));
    this._$alphaPicker.val(color.a);
};

_.getTransferFunction = function() {
    return this._canvas;
};

_._onColorChange = function() {
    var $selectedBump = this._$html.find('.bump.selected');
    var i = parseInt(DOMUtils.data($selectedBump.get(0), 'index'), 10);
    var color = CommonUtils.hex2rgb(this._$colorPicker.val());
    var alpha = parseFloat(this._$alphaPicker.val());
    this._bumps[i].color.r = color.r;
    this._bumps[i].color.g = color.g;
    this._bumps[i].color.b = color.b;
    this._bumps[i].color.a = alpha;
    this.render();
    this.onChange && this.onChange();
};

// ============================ STATIC METHODS ============================= //

})(this);
