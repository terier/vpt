//@@utils
//@@readers
//@@loaders
//@@dialogs
//@@dialogs/renderers
//@@dialogs/tonemappers
//@@ui
//@@RenderingContext.js
//@@Volume.js

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
    this._renderingContext       = null;
    this._canvas                 = null;
    this._statusBar              = null;

    this._mainDialog             = null;
    this._volumeLoadDialog       = null;
    this._envmapLoadDialog       = null;
    this._renderingContextDialog = null;

    this._rendererDialog         = null;
    this._toneMapperDialog       = null;
};

_._init = function() {
    _._nullify.call(this);

    this._renderingContext = new RenderingContext();
    this._canvas = this._renderingContext.getCanvas();
    this._canvas.className += 'renderer';
    document.body.appendChild(this._canvas);

    window.addEventListener('resize', function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        this._renderingContext.resize(width, height);
    }.bind(this));
    CommonUtils.trigger('resize', window);

    document.body.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    document.body.addEventListener('drop', function(e) {
        e.preventDefault();
        var files = e.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            var readerClass = this._getReaderForURL(file.name);
            if (readerClass) {
                var loader = new BlobLoader(file);
                var reader = new readerClass(loader);
                this._renderingContext.stopRendering();
                this._renderingContext.setVolume(reader);
            }
        }
    }.bind(this));

    this._mainDialog = new MainDialog();
    this._statusBar = new StatusBar();
    this._statusBar.appendTo(document.body);

    this._volumeLoadDialog = new VolumeLoadDialog();
    this._volumeLoadDialog.appendTo(this._mainDialog.getVolumeLoadContainer());
    this._volumeLoadDialog.addEventListener('loadfile', function(options) {
        var readerClass = this._getReaderForURL(options.file.name);
        if (readerClass) {
            var loader = new BlobLoader(options.file);
            var reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    }.bind(this));

    this._volumeLoadDialog.addEventListener('loadurl', function(options) {
        var readerClass = this._getReaderForURL(options.url);
        if (readerClass) {
            var loader = new AjaxLoader(options.url);
            var reader = new readerClass(loader);
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    }.bind(this));

    this._envmapLoadDialog = new EnvmapLoadDialog();
    this._envmapLoadDialog.appendTo(this._mainDialog.getEnvmapLoadContainer());
    this._envmapLoadDialog.addEventListener('loadfile', function(options) {
        var image = new Image();
        image.crossOrigin = 'anonymous';
        image.addEventListener('load', function() {
            this._renderingContext.setEnvironmentMap(image);
            this._renderingContext.getRenderer().reset();
        }.bind(this));

        var reader = new FileReader();
        reader.addEventListener('load', function() {
            image.src = reader.result;
        });

        reader.readAsDataURL(options.file);
    }.bind(this));
    this._envmapLoadDialog.addEventListener('loadurl', function(options) {
        var image = new Image();
        image.crossOrigin = 'anonymous';
        image.addEventListener('load', function() {
            this._renderingContext.setEnvironmentMap(image);
            this._renderingContext.getRenderer().reset();
        }.bind(this));

        image.src = options.url;
    }.bind(this));

    this._renderingContextDialog = new RenderingContextDialog();
    this._renderingContextDialog.appendTo(
        this._mainDialog.getRenderingContextSettingsContainer());
    this._renderingContextDialog.addEventListener('resolution', function(options) {
        this._renderingContext.setResolution(options.resolution);
    }.bind(this));
    this._renderingContextDialog.addEventListener('transformation', function(options) {
        var s = options.scale;
        var t = options.translation;
        this._renderingContext.setScale(s.x, s.y, s.z);
        this._renderingContext.setTranslation(t.x, t.y, t.z);
    }.bind(this));

    this._mainDialog.addEventListener('rendererchange', function(which) {
        if (this._rendererDialog) {
            this._rendererDialog.destroy();
        }
        this._renderingContext.chooseRenderer(which);
        var renderer = this._renderingContext.getRenderer();
        var container = this._mainDialog.getRendererSettingsContainer();
        var dialogClass = this._getDialogForRenderer(which);
        this._rendererDialog = new dialogClass(renderer);
        this._rendererDialog.appendTo(container);
    }.bind(this));

    this._mainDialog.addEventListener('tonemapperchange', function(which) {
        if (this._toneMapperDialog) {
            this._toneMapperDialog.destroy();
        }
        this._renderingContext.chooseToneMapper(which);
        var toneMapper = this._renderingContext.getToneMapper();
        var container = this._mainDialog.getToneMapperSettingsContainer();
        var dialogClass = this._getDialogForToneMapper(which);
        this._toneMapperDialog = new dialogClass(toneMapper);
        this._toneMapperDialog.appendTo(container);
    }.bind(this));
};

_.destroy = function() {
    this._renderingContext.destroy();
    this._mainDialog.destroy();

    this._volumeLoadDialog.destroy();
    this._envmapLoadDialog.destroy();
    this._renderingContextDialog.destroy();

    if (this._rendererDialog) {
        this._rendererDialog.destroy();
    }

    if (this._toneMapperDialog) {
        this._toneMapperDialog.destroy();
    }

    DOMUtils.remove(this._canvas);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._getReaderForURL = function(url) {
    var lastDot = url.lastIndexOf('.');
    if (lastDot === -1) {
        return null;
    }

    var ext = url.substring(lastDot + 1).toLowerCase();
    switch (ext) {
        case 'bvp'  : return BVPReader;
        case 'json' : return JSONReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
        default     : return null;
    }
};

_._getDialogForRenderer = function(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRendererDialog;
        case 'iso' : return ISORendererDialog;
        case 'eam' : return EAMRendererDialog;
        case 'mcs' : return MCSRendererDialog;
        case 'mcm' : return MCMRendererDialog;
    }
};

_._getDialogForToneMapper = function(toneMapper) {
    switch (toneMapper) {
        case 'range'    : return RangeToneMapperDialog;
        case 'reinhard' : return ReinhardToneMapperDialog;
        case 'artistic' : return ArtisticToneMapperDialog;
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
