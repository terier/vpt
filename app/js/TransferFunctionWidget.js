//@@utils
//@@EventEmitter.js
//@@WebGL.js

(function(global) {
'use strict';

var Class = global.TransferFunctionWidget = TransferFunctionWidget;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function TransferFunctionWidget(options) {
    CommonUtils.extend(_, EventEmitter);
    CommonUtils.extend(this, Class.defaults, options);

    this._onColorChange = this._onColorChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
    _width                  : 256,
    _height                 : 256,
    _transferFunctionWidth  : 256,
    _transferFunctionHeight : 256,
    scaleSpeed              : 0.003
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

    this._$html = DOMUtils.instantiate(TEMPLATES.TransferFunctionWidget);
    this._$colorPicker   = this._$html.querySelector('[name="color"]');
    this._$alphaPicker   = this._$html.querySelector('[name="alpha"]');
    this._$addBumpButton = this._$html.querySelector('[name="add-bump"]');
    this._$loadButton    = this._$html.querySelector('[name="load"]');
    this._$saveButton    = this._$html.querySelector('[name="save"]');

    this._canvas = this._$html.querySelector('canvas');
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
    this._$addBumpButton.addEventListener('click', function() {
        this.addBump();
    }.bind(this));

    this._$colorPicker.addEventListener('change', this._onColorChange);
    this._$alphaPicker.addEventListener('change', this._onColorChange);

    this._$loadButton.addEventListener('click', function() {
        CommonUtils.readTextFile(function(data) {
            this._bumps = JSON.parse(data);
            this.render();
            this._rebuildHandles();
            this.trigger('change');
        }.bind(this));
    }.bind(this));

    this._$saveButton.addEventListener('click', function() {
        CommonUtils.downloadJSON(this._bumps, 'TransferFunction.json');
    }.bind(this));
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._program.program);
    DOMUtils.remove(this._$html);

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
            x: 0.5,
            y: 0.5
        },
        size: {
            x: 0.2,
            y: 0.2
        },
        color: {
            r: 1,
            g: 0,
            b: 0,
            a: 1
        }
    };
    this._bumps.push(newBump);
    this._addHandle(bumpIndex);
    this.selectBump(bumpIndex);
    this.render();
    this.trigger('change');
};

_._addHandle = function(index) {
    var $handle = DOMUtils.instantiate(TEMPLATES.TransferFunctionWidgetBumpHandle);
    this._$html.querySelector('.widget').appendChild($handle);
    DOMUtils.data($handle, 'index', index);

    var left = this._bumps[index].position.x * this._width;
    var top = (1 - this._bumps[index].position.y) * this._height;
    $handle.style.left = Math.round(left) + 'px';
    $handle.style.top = Math.round(top) + 'px';

    new Draggable($handle, $handle.querySelector('.bump-handle'));
    $handle.addEventListener('draggable', function(e) {
        var x = e.currentTarget.offsetLeft / this._width;
        var y = 1 - (e.currentTarget.offsetTop / this._height);
        var i = parseInt(DOMUtils.data(e.currentTarget, 'index'));
        this._bumps[i].position.x = x;
        this._bumps[i].position.y = y;
        this.render();
        this.trigger('change');
    }.bind(this));
    $handle.addEventListener('mousedown', function(e) {
        var i = parseInt(DOMUtils.data(e.currentTarget, 'index'));
        this.selectBump(i);
    }.bind(this));
    $handle.addEventListener('mousewheel', function(e) {
        var amount = e.deltaY * this.scaleSpeed;
        var scale = Math.exp(-amount);
        var i = parseInt(DOMUtils.data(e.currentTarget, 'index'));
        this.selectBump(i);
        if (e.shiftKey) {
            this._bumps[i].size.y *= scale;
        } else {
            this._bumps[i].size.x *= scale;
        }
        this.render();
        this.trigger('change');
    }.bind(this));
};

_._rebuildHandles = function() {
    var handles = this._$html.querySelectorAll('.bump');
    handles.forEach(function(handle) {
        DOMUtils.remove(handle);
    });
    for (var i = 0; i < this._bumps.length; i++) {
        this._addHandle(i);
    }
};

_.selectBump = function(index) {
    var handles = this._$html.querySelectorAll('.bump');
    handles.forEach(function(handle) {
        var i = parseInt(DOMUtils.data(handle, 'index'));
        if (i === index) {
            handle.classList.add('selected');
        } else {
            handle.classList.remove('selected');
        }
    });

    var color = this._bumps[index].color;
    this._$colorPicker.value = CommonUtils.rgb2hex(color.r, color.g, color.b);
    this._$alphaPicker.value = color.a;
};

_.getTransferFunction = function() {
    return this._canvas;
};

_._onColorChange = function() {
    var $selectedBump = this._$html.querySelector('.bump.selected');
    var i = parseInt(DOMUtils.data($selectedBump, 'index'));
    var color = CommonUtils.hex2rgb(this._$colorPicker.value);
    var alpha = parseFloat(this._$alphaPicker.value);
    this._bumps[i].color.r = color.r;
    this._bumps[i].color.g = color.g;
    this._bumps[i].color.b = color.b;
    this._bumps[i].color.a = alpha;
    this.render();
    this.trigger('change');
};

_.appendTo = function(object) {
    object.appendChild(this._$html);
};

// ============================ STATIC METHODS ============================= //

})(this);
