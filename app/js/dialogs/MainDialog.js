//@@../utils
//@@../ui
//@@../EventEmitter.js

(function(global) {
'use strict';

var Class = global.MainDialog = MainDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MainDialog(options) {
    CommonUtils.extend(_, EventEmitter);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);


    var ui = UI.create(UISPECS['MainDialog']).binds;
    ui.sidebar.appendTo(document.body);

    ui.volumeType.addEventListener('change', function() {
        // TODO: switching panel
        switch (ui.volumeType.getValue()) {
            case 'file':
                ui.volumeTypeFile.show();
                ui.volumeTypeURL.hide();
                ui.volumeTypeDemo.hide();
                break;
            case 'url':
                ui.volumeTypeFile.hide();
                ui.volumeTypeURL.show();
                ui.volumeTypeDemo.hide();
                break;
            case 'demo':
                ui.volumeTypeFile.hide();
                ui.volumeTypeURL.hide();
                ui.volumeTypeDemo.show();
                break;
        }
    });
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //



// ============================ STATIC METHODS ============================= //

})(this);
