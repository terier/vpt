//@@utils/Utils.js

//@@ui/Panel.js
//@@ui/Sidebar.js
//@@ui/Field.js
//@@ui/Checkbox.js
//@@ui/Spinner.js
//@@ui/Tabs.js
//@@ui/Spacer.js

//@@Navbar.js

//@@RenderingContext.js
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
//@@dialogs/ArtisticToneMapperDialog.js

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
    this._canvas                   = null;
    this._navbar                   = null;

    this._openFileDialog           = null;
    this._openEnvironmentMapDialog = null;
    this._renderingContextDialog   = null;
    this._rendererDialog           = null;
    this._toneMapperDialog         = null;
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

    this._createUI();

    /*this._openFileDialog = new OpenFileDialog(
        document.body, {
        onLoad: function(data, size, bits) {
            var loader = new BlobLoader(data);
            var reader = new RAWReader(loader, {
                width: size.x,
                height: size.y,
                depth: size.z,
                bits: bits
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
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
        this._renderingContext);

    this._rendererDialog = new MultipleScatteringRendererDialog(
            document.body,
            this._renderingContext.getRenderer());

    this._toneMapperDialog = new ArtisticToneMapperDialog(
            document.body,
            this._renderingContext.getToneMapper());

    var navbar = this._navbar = new Navbar(document.body);

    navbar.on('open-file-dialog', function() {
        this._openFileDialog.show();
    }.bind(this));

    navbar.on('open-environment-map-dialog', function() {
        this._openEnvironmentMapDialog.show();
    }.bind(this));

    navbar.on('reset-renderer', function() {
        this._renderingContext.getRenderer().reset();
    }.bind(this));

    navbar.on('rendering-context-dialog', function() {
        this._renderingContextDialog.show();
    }.bind(this));

    navbar.on('renderer-settings-dialog', function() {
        if (this._rendererDialog) {
            this._rendererDialog.show();
        }
    }.bind(this));

    navbar.on('tone-mapper-settings-dialog', function() {
        if (this._toneMapperDialog) {
            this._toneMapperDialog.show();
        }
    }.bind(this));

    navbar.on('choose-renderer', function(renderer) {
        this._renderingContext.chooseRenderer(renderer);
        if (this._rendererDialog) {
            this._rendererDialog.destroy();
        }
        var dialogClass;
        switch (renderer) {
            case 'MIP': dialogClass = MIPRendererDialog; break;
            case 'ISO': dialogClass = ISORendererDialog; break;
            case 'EAM': dialogClass = EAMRendererDialog; break;
            case 'MCS': dialogClass = MCSRendererDialog; break;
            case 'Multiple Scattering': dialogClass = MultipleScatteringRendererDialog; break;
        }
        this._rendererDialog = new dialogClass(
            document.body,
            this._renderingContext.getRenderer());
    }.bind(this));

    navbar.on('choose-tone-mapper', function(toneMapper) {
        this._renderingContext.chooseToneMapper(toneMapper);
        if (this._toneMapperDialog) {
            this._toneMapperDialog.destroy();
        }
        var dialogClass;
        switch (toneMapper) {
            case 'Range'   : dialogClass = RangeToneMapperDialog; break;
            case 'Reinhard': dialogClass = ReinhardToneMapperDialog; break;
            case 'Artistic': dialogClass = ArtisticToneMapperDialog; break;
        }
        this._toneMapperDialog = new dialogClass(
            document.body,
            this._renderingContext.getToneMapper());
    }.bind(this));*/
};

_.destroy = function() {
    this._renderingContext.destroy();
    this._navbar.destroy();
    this._openFileDialog.destroy();
    this._openEnvironmentMapDialog.destroy();
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

    var ext = url.substr(lastDot + 1).toLowerCase();
    switch (ext) {
        case 'bvp'  : return BVPReader;
        case 'json' : return JSONReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
        default     : return null;
    }
};

_._createUI = function() {
    var sidebar = new Sidebar();

    var panel1 = new Panel();
    var field1 = new Field('Coordinates');
    var checkbox1 = new Checkbox();
    var field2 = new Field('A bit longer label this time');
    var spinner = new Spinner();

    var panel2 = new Panel();
    var field3 = new Field('Enabled');
    var checkbox2 = new Checkbox();

    var tabs = new Tabs();

    sidebar.appendTo(document.body);

    sidebar.add(tabs);
    tabs.add(panel1, 'Settings');
    tabs.add(panel2, 'Renderer');
    panel1.add(new Spacer({ height: '10px' }));
    panel1.add(field1);
    panel1.add(field2);
    field1.add(checkbox1);
    field2.add(spinner);
    panel2.add(new Spacer({ height: '10px' }));
    panel2.add(field3);
    field3.add(checkbox2);

    spinner.addEventListener('changeall', function() {
        console.log(spinner.getValue());
    });

    spinner.addEventListener('change', function(e) {
        console.log('change', spinner.getValue());
    });
};

// ============================ STATIC METHODS ============================= //

})(this);
