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

    this._handleVolumeTypeChange = this._handleVolumeTypeChange.bind(this);
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
    this._demo = null;
};

_._init = function() {
    _._nullify.call(this);

    this._demo = [];

    this._addEventListeners();
    this._loadDemoJson();
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._addEventListeners = function() {
    this._binds.volumeType.addEventListener('change', this._handleVolumeTypeChange);
    this._binds.loadButton.addEventListener('click', this._handleLoadClick);
    this._binds.volumeFile.addEventListener('change', this._handleFileChange);
    this._binds.volumeURL.addEventListener('input', this._handleURLChange);
    this._binds.volumeDemo.addEventListener('change', this._handleDemoChange);
};

_._loadDemoJson = function() {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function() {
        this._demo = JSON.parse(xhr.responseText);
        this._demo.forEach(function(demo) {
            this._binds.volumeDemo.addOption(demo.value, demo.label);
        }.bind(this));
    }.bind(this));
    xhr.open('GET', 'demo.json');
    xhr.send();
};

_._getVolumeTypeFromFileName = function(filename) {
    var exn = filename.split('.').pop().toLowerCase();
    var exnToType = {
        'bvp'  : 'bvp',
        'json' : 'json',
        'zip'  : 'zip',
    };
    return exnToType[exn] || 'raw';
};

_._handleLoadClick = function() {
    switch (this._binds.volumeType.getValue()) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
};

_._handleLoadFile = function() {
    var files = this._binds.volumeFile.getFiles();
    if (files.length === 0) {
        // update status bar?
        return;
    }

    var file = files[0];
    var type = this._getVolumeTypeFromFileName(file.name);
    var dimensions = this._binds.volumeDimensions.getValue();
    var precision = parseInt(this._binds.volumePrecision.getValue(), 10);

    this.trigger('loadfile', {
        file       : file,
        type       : type,
        dimensions : dimensions,
        precision  : precision,
    });
};

_._handleLoadURL = function() {
    var url = this._binds.volumeURL.getValue();
    this.trigger('loadurl', {
        url: url
    });
};

_._handleLoadDemo = function() {
    var demo = this._binds.volumeDemo.getValue();
    var found = this._demo.find(function(d) {
        return d.value === demo;
    });
    if (found) {
        this.trigger('loadurl', {
            url: found.url
        });
    }
};

_._handleVolumeTypeChange = function() {
    // TODO: switching panel
    switch (this._binds.volumeType.getValue()) {
        case 'file':
            this._binds.volumeTypeFile.show();
            this._binds.volumeTypeURL.hide();
            this._binds.volumeTypeDemo.hide();
            break;
        case 'url':
            this._binds.volumeTypeFile.hide();
            this._binds.volumeTypeURL.show();
            this._binds.volumeTypeDemo.hide();
            break;
        case 'demo':
            this._binds.volumeTypeFile.hide();
            this._binds.volumeTypeURL.hide();
            this._binds.volumeTypeDemo.show();
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
};

_._handleFileChange = function() {
    var files = this._binds.volumeFile.getFiles();
    if (files.length === 0) {
        this._binds.rawSettingsPanel.hide();
    } else {
        var file = files[0];
        var type = this._getVolumeTypeFromFileName(file.name);
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
    switch (this._binds.volumeType.getValue()) {
        case 'file':
            var files = this._binds.volumeFile.getFiles();
            this._binds.loadButtonAndProgress.setVisible(files.length > 0);
            break;
        case 'url':
            var urlEmpty = this._binds.volumeURL.getValue() === '';
            this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
            break;
        case 'demo':
            var demo = this._binds.volumeDemo.getValue();
            this._binds.loadButtonAndProgress.setVisible(!!demo);
            break;
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
