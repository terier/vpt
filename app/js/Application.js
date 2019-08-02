//@@utils
//@@readers
//@@loaders
//@@dialogs
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
    this._renderingContext = null;
    this._canvas           = null;
    this._statusBar        = null;

    this._mainDialog       = null;
    this._volumeLoadDialog = null;
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
};

_.destroy = function() {
    this._renderingContext.destroy();
    this._mainDialog.destroy();

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

// ============================ STATIC METHODS ============================= //

})(this);
