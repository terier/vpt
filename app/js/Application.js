//@@RenderingContext.js
//@@Navbar.js
//@@Volume.js
//@@dialogs/OpenFileDialog.js
//@@dialogs/OpenEnvironmentMapDialog.js
//@@dialogs/RenderingContextDialog.js
//@@dialogs/MIPRendererDialog.js
//@@dialogs/ISORendererDialog.js
//@@dialogs/EAMRendererDialog.js
//@@dialogs/MCSRendererDialog.js
//@@dialogs/ReinhardToneMapperDialog.js
//@@dialogs/RangeToneMapperDialog.js

(function(global) {
'use strict';

var Class = global.Application = Application;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Application(options) {
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._renderingContext         = null;
    this._$canvas                  = null;
    this._navbar                   = null;
    this._openFileDialog           = null;
    this._openEnvironmentMapDialog = null;
    this._renderingContextDialog   = null;
    this._mipRendererDialog        = null;
    this._isoRendererDialog        = null;
    this._eamRendererDialog        = null;
    this._mcsRendererDialog        = null;
    this._reinhardToneMapperDialog = null;
    this._rangeToneMapperDialog    = null;
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
            this._renderingContext.getRenderer().reset();
        }.bind(this)
    });

    this._openEnvironmentMapDialog = new OpenEnvironmentMapDialog(
        document.body, {
        onLoad: function(image) {
            this._renderingContext.setEnvironmentMap(image);
            this._renderingContext.getRenderer().reset();
        }.bind(this)
    });

    this._renderingContextDialog = new RenderingContextDialog(
        document.body,
        this._renderingContext, {
    });

    // TODO: instantiate correct dialog with an abstract factory
    this._mipRendererDialog = new MIPRendererDialog(
        document.body,
        this._renderingContext.getRenderer(), {
    });

    this._isoRendererDialog = new ISORendererDialog(
        document.body,
        this._renderingContext.getRenderer(), {
    });

    this._eamRendererDialog = new EAMRendererDialog(
        document.body,
        this._renderingContext.getRenderer(), {
    });

    this._mcsRendererDialog = new MCSRendererDialog(
        document.body,
        this._renderingContext.getRenderer(), {
    });

    this._reinhardToneMapperDialog = new ReinhardToneMapperDialog(
        document.body,
        this._renderingContext.getToneMapper(), {
    });

    this._rangeToneMapperDialog = new RangeToneMapperDialog(
        document.body,
        this._renderingContext.getToneMapper(), {
    });

    this._navbar = new Navbar(
        document.body, {
        onOpenFileDialog: function() {
            this._openFileDialog.show();
        }.bind(this),
        onOpenEnvironmentMapDialog: function() {
            this._openEnvironmentMapDialog.show();
        }.bind(this),
        onResetRenderer: function() {
            this._renderingContext._renderer.reset();
        }.bind(this),
        onRenderingContextDialog: function() {
            this._renderingContextDialog.show();
        }.bind(this),
        onMipRendererDialog: function() {
            this._mipRendererDialog.show();
        }.bind(this),
        onIsoRendererDialog: function() {
            this._isoRendererDialog.show();
        }.bind(this),
        onEamRendererDialog: function() {
            this._eamRendererDialog.show();
        }.bind(this),
        onMcsRendererDialog: function() {
            this._mcsRendererDialog.show();
        }.bind(this),
        onReinhardToneMapperDialog: function() {
            this._reinhardToneMapperDialog.show();
        }.bind(this),
        onRangeToneMapperDialog: function() {
            this._rangeToneMapperDialog.show();
        }.bind(this)
    });

    this._renderingContext.startRendering();
};

_.destroy = function() {
    this._renderingContext.destroy();
    this._navbar.destroy();
    this._openFileDialog.destroy();
    this._openEnvironmentMapDialog.destroy();
    this._mipRendererDialog.destroy();
    this._isoRendererDialog.destroy();
    this._eamRendererDialog.destroy();
    this._mcsRendererDialog.destroy();
    this._reinhardToneMapperDialog.destroy();
    this._rangeToneMapperDialog.destroy();
    this._$canvas.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
