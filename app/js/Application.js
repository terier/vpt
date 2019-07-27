//@@utils
//@@readers
//@@loaders
//@@dialogs
//@@ui
//@@Navbar.js
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

    var ext = url.substring(lastDot + 1).toLowerCase();
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
    sidebar.appendTo(document.body);

    var tabs = new Tabs();
    sidebar.add(tabs);

    // first tab

    var tab1 = new Panel();
    tabs.add(tab1, 'Settings');

    // first panel
    var panel1 = new Panel();
    tab1.add(panel1);
    var checkbox1 = new Checkbox({ checked: false });
    var field1 = new Field('Coordinates');
    field1.add(checkbox1);
    var spinner = new Spinner({
        step: 0.1,
        logarithmic: true
    });
    var field2 = new Field('A bit longer label this time', { enabled: false });
    field2.add(spinner);
    panel1.add(field1);
    panel1.add(field2);

    var dropdown = new Dropdown([
        { value: 'first',  label: 'First item'  },
        { value: 'second', label: 'Second item' },
    ]);
    var field3 = new Field('Renderer');
    field3.add(dropdown);
    panel1.add(field3);

    var accordion = new Accordion('Name');
    var accordionPanel = new Panel();
    var field5 = new Field('Test text');
    field5.add(new Spinner());
    accordionPanel.add(field5);
    accordion.add(accordionPanel);
    tab1.add(accordion);

    var radio = new Radio([
        { value: 8,  label: '8-bit', selected: true },
        { value: 16, label: '16-bit' }
    ]);
    var field6 = new Field('Precision');
    field6.add(radio);
    accordionPanel.add(field6);

    var color = new ColorChooser();
    var field7 = new Field('Color');
    field7.add(color);
    accordionPanel.add(field7);

    var slider = new Slider();
    var field8 = new Field('Extinction');
    field8.add(slider);
    accordionPanel.add(field8);

    var filechooser = new FileChooser();
    var field9 = new Field('File');
    field9.add(filechooser);
    accordionPanel.add(field9);

    // second tab

    var tab2 = new Panel();
    tabs.add(tab2, 'Renderer');

    var checkbox2 = new Checkbox();
    var field4 = new Field('Enabled', { enabled: false });
    field4.add(checkbox2);
    tab2.add(field4);

    // events

    tabs.selectTab(tab1);

    checkbox1.addEventListener('change', function() {
        field2.setEnabled(checkbox1.isChecked());
    });

    spinner.addEventListener('changeall', function() {
        console.log(spinner.getValue());
    });

    spinner.addEventListener('change', function(e) {
        console.log('change', spinner.getValue());
    });
};

// ============================ STATIC METHODS ============================= //

})(this);
