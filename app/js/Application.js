//@@utils/Utils.js
//@@RenderingContext.js
//@@Navbar.js
//@@Volume.js
//@@readers/BVPReader.js
//@@readers/JSONReader.js
//@@readers/RAWReader.js
//@@readers/ZIPReader.js
//@@loaders/BlobLoader.js
//@@loaders/AjaxLoader.js
//@@dialogs/OpenFileDialog.js
//@@dialogs/OpenEnvironmentMapDialog.js
//@@dialogs/RenderingContextDialog.js
//@@dialogs/MIPRendererDialog.js
//@@dialogs/ISORendererDialog.js
//@@dialogs/EAMRendererDialog.js
//@@dialogs/MCSRendererDialog.js
//@@dialogs/MultipleScatteringRendererDialog.js
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
    this._renderingContext                 = null;
    this._canvas                           = null;
    this._navbar                           = null;
    this._openFileDialog                   = null;
    this._openEnvironmentMapDialog         = null;
    this._renderingContextDialog           = null;
    this._mipRendererDialog                = null;
    this._isoRendererDialog                = null;
    this._eamRendererDialog                = null;
    this._mcsRendererDialog                = null;
    this._multipleScatteringRendererDialog = null;
    this._reinhardToneMapperDialog         = null;
    this._rangeToneMapperDialog            = null;
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
                var volume = new Volume(reader);
                this._renderingContext.stopRendering();
                this._renderingContext.setVolume(volume);
            }
        }
    }.bind(this));

    this._openFileDialog = new OpenFileDialog(
        document.body, {
        onLoad: function(data, size, bits) {
            //var volume = new Volume(data, size.x, size.y, size.z, bits);
            //this._renderingContext.setVolume(volume);
            //this._renderingContext.getRenderer().reset();
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

    this._multipleScatteringRendererDialog = new MultipleScatteringRendererDialog(
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
        onMultipleScatteringRendererDialog: function() {
            this._multipleScatteringRendererDialog.show();
        }.bind(this),
        onReinhardToneMapperDialog: function() {
            this._reinhardToneMapperDialog.show();
        }.bind(this),
        onRangeToneMapperDialog: function() {
            this._rangeToneMapperDialog.show();
        }.bind(this),
        onChooseMipRenderer: function() {
            this._renderingContext.chooseRenderer('MIP');
            this._mipRendererDialog.destroy();
            this._mipRendererDialog = new MIPRendererDialog(
                document.body,
                this._renderingContext.getRenderer(), {
            });
        }.bind(this),
        onChooseIsoRenderer: function() {
            this._renderingContext.chooseRenderer('ISO');
            this._isoRendererDialog.destroy();
            this._isoRendererDialog = new ISORendererDialog(
                document.body,
                this._renderingContext.getRenderer(), {
            });
        }.bind(this),
        onChooseEamRenderer: function() {
            this._renderingContext.chooseRenderer('EAM');
            this._eamRendererDialog.destroy();
            this._eamRendererDialog = new EAMRendererDialog(
                document.body,
                this._renderingContext.getRenderer(), {
            });
        }.bind(this),
        onChooseMcsRenderer: function() {
            this._renderingContext.chooseRenderer('MCS');
            this._mcsRendererDialog.destroy();
            this._mcsRendererDialog = new MCSRendererDialog(
                document.body,
                this._renderingContext.getRenderer(), {
            });
        }.bind(this),
        onChooseMultipleScatteringRenderer: function() {
            this._renderingContext.chooseRenderer('Multiple Scattering');
            this._multipleScatteringRendererDialog.destroy();
            this._multipleScatteringRendererDialog = new MultipleScatteringRendererDialog(
                document.body,
                this._renderingContext.getRenderer(), {
            });
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
    this._multipleScatteringRendererDialog.destroy();
    this._reinhardToneMapperDialog.destroy();
    this._rangeToneMapperDialog.destroy();
    DOMUtils.remove(this._canvas);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._getReaderForURL = function(url) {
    var lastDot = url.lastIndexOf('.');
    if (lastDot === -1) {
        return null;
    }

    var ext = url.substr(lastDot + 1).toLowerCase();
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
