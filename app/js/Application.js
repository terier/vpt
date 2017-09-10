(function(global) {
'use strict';

var Class = global.Application = Application;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Application(options) {
    $.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._renderingContext      = null;
    this._$canvas               = null;
    this._navbar                = null;
    this._openFileDialog        = null;
    this._mipRendererController = null;
    this._isoRendererController = null;
    this._eamRendererController = null;
};

_._init = function() {
    _._nullify.call(this);

    this._renderingContext = new RenderingContext();
    this._$canvas = $(this._renderingContext.getCanvas());
    this._$canvas.addClass('renderer');
    $(document.body).append(this._$canvas);

    $(window).resize(function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        this._renderingContext.resize(width, height);
    }.bind(this));
    $(window).resize();

    this._openFileDialog = new OpenFileDialog(
        document.body, {
        onLoad: function(data, size, bits) {
            var volume = new Volume(data, size.x, size.y, size.z, bits);
            this._renderingContext.setVolume(volume);
            this._renderingContext._renderer.reset();
        }.bind(this)
    });

    this._mipRendererController = new MIPRendererController(
        document.body,
        this._renderingContext._renderer, {
    });

    this._isoRendererController = new ISORendererController(
        document.body,
        this._renderingContext._renderer, {
    });

    this._eamRendererController = new EAMRendererController(
        document.body,
        this._renderingContext._renderer, {
    });

    this._navbar = new Navbar(
        document.body, {
        onOpenFile: function() {
            this._openFileDialog.show();
        }.bind(this),
        onMipRendererController: function() {
            this._mipRendererController.show();
        }.bind(this),
        onIsoRendererController: function() {
            this._isoRendererController.show();
        }.bind(this),
        onEamRendererController: function() {
            this._eamRendererController.show();
        }.bind(this),
        onResetRenderer: function() {
            this._renderingContext._renderer.reset();
        }.bind(this)
    });

    this._renderingContext.startRendering();
};

_.destroy = function() {
    this._renderingContext.destroy();
    this._navbar.destroy();
    this._openFileDialog.destroy();
    this._mipRendererController.destroy();
    this._isoRendererController.destroy();
    this._eamRendererController.destroy();
    this._$canvas.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
