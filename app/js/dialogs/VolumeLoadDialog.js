//@@../utils
//@@../ui
//@@AbstractDialog.js
//@@../EventEmitter.js

(function(global) {
'use strict';

var Class = global.VolumeLoadDialog = VolumeLoadDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function VolumeLoadDialog(options) {
    _.sup.constructor.call(this, UISPECS.VolumeLoadDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleTypeChange = this._handleTypeChange.bind(this);
    this._handleLoadClick = this._handleLoadClick.bind(this);
    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleURLChange = this._handleURLChange.bind(this);
    this._handleDemoChange = this._handleDemoChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._demos = null;
};

_._init = function() {
    _._nullify.call(this);

    this._demos = [];

    this._addEventListeners();
    this._loadDemoJson();
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._addEventListeners = function() {
    this._binds.type.addEventListener('change', this._handleTypeChange);
    this._binds.loadButton.addEventListener('click', this._handleLoadClick);
    this._binds.file.addEventListener('change', this._handleFileChange);
    this._binds.url.addEventListener('input', this._handleURLChange);
    this._binds.demo.addEventListener('change', this._handleDemoChange);
};

_._loadDemoJson = function() {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
        if (xhr.status === 200) {
            this._demos = JSON.parse(xhr.responseText);
            this._demos.forEach(function(demo) {
                this._binds.demo.addOption(demo.value, demo.label);
            }.bind(this));
        }
    }.bind(this));
    xhr.open('GET', 'demo-volumes.json');
    xhr.send();
};

_._getVolumeTypeFromURL = function(filename) {
    var exn = filename.split('.').pop().toLowerCase();
    var exnToType = {
        'bvp'  : 'bvp',
        'json' : 'json',
        'zip'  : 'zip',
    };
    return exnToType[exn] || 'raw';
};

_._handleLoadClick = function() {
    switch (this._binds.type.getValue()) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
};

_._handleLoadFile = function() {
    var files = this._binds.file.getFiles();
    if (files.length === 0) {
        // update status bar?
        return;
    }

    var file = files[0];
    var filetype = this._getVolumeTypeFromURL(file.name);
    var dimensions = this._binds.dimensions.getValue();
    var precision = parseInt(this._binds.precision.getValue(), 10);

    this.trigger('load', {
        type       : 'file',
        file       : file,
        filetype   : filetype,
        dimensions : dimensions,
        precision  : precision,
    });
};

_._handleLoadURL = function() {
    var url = this._binds.url.getValue();
    var filetype = this._getVolumeTypeFromURL(url);
    this.trigger('load', {
        type     : 'url',
        url      : url,
        filetype : filetype
    });
};

_._handleLoadDemo = function() {
    var demo = this._binds.demo.getValue();
    var found = this._demos.find(function(d) {
        return d.value === demo;
    });
    var filetype = this._getVolumeTypeFromURL(found.url);
    this.trigger('load', {
        type     : 'url',
        url      : found.url,
        filetype : filetype
    });
};

_._handleTypeChange = function() {
    // TODO: switching panel
    switch (this._binds.type.getValue()) {
        case 'file':
            this._binds.filePanel.show();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.hide();
            break;
        case 'url':
            this._binds.filePanel.hide();
            this._binds.urlPanel.show();
            this._binds.demoPanel.hide();
            break;
        case 'demo':
            this._binds.filePanel.hide();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.show();
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
};

_._handleFileChange = function() {
    var files = this._binds.file.getFiles();
    if (files.length === 0) {
        this._binds.rawSettingsPanel.hide();
    } else {
        var file = files[0];
        var type = this._getVolumeTypeFromURL(file.name);
        this._binds.rawSettingsPanel.setVisible(type === 'raw');
    }
    this._updateLoadButtonAndProgressVisibility();
};

_._handleURLChange = function() {
    this._updateLoadButtonAndProgressVisibility();
};

_._handleDemoChange = function() {
    this._updateLoadButtonAndProgressVisibility();
};

_._updateLoadButtonAndProgressVisibility = function() {
    switch (this._binds.type.getValue()) {
        case 'file':
            var files = this._binds.file.getFiles();
            this._binds.loadButtonAndProgress.setVisible(files.length > 0);
            break;
        case 'url':
            var urlEmpty = this._binds.url.getValue() === '';
            this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
            break;
        case 'demo':
            var demo = this._binds.demo.getValue();
            this._binds.loadButtonAndProgress.setVisible(!!demo);
            break;
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
