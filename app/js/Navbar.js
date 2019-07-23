//@@utils/Utils.js
//@@EventEmitter.js

(function(global) {
'use strict';

var Class = global.Navbar = Navbar;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Navbar(container, options) {
    CommonUtils.extend(this, Class.defaults, options);
    CommonUtils.extend(this, EventEmitter);

    this._$container = container;

    _._init.call(this);
}

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._html = null;
    this._eventHandlers = {};
};

_._init = function() {
    _._nullify.call(this);

    var html = DOMUtils.instantiate(TEMPLATES['Navbar.html']);
    this._$container.appendChild(html);

    var handle = function(query, handler) {
        var el = html.querySelector(query);
        el.addEventListener('click', handler.bind(this));
    }.bind(this);

    handle('[name="open-file-dialog"]', function() {
        this.trigger('open-file-dialog');
    });
    handle('[name="open-environment-map-dialog"]', function() {
        this.trigger('open-environment-map-dialog');
    });

    handle('[name="reset-renderer"]', function() {
        this.trigger('reset-renderer');
    });
    handle('[name="rendering-context-dialog"]', function() {
        this.trigger('rendering-context-dialog');
    });
    handle('[name="renderer-settings-dialog"]', function() {
        this.trigger('renderer-settings-dialog');
    });
    handle('[name="tone-mapper-settings-dialog"]', function() {
        this.trigger('tone-mapper-settings-dialog');
    });

    handle('[name="choose-mip-renderer"]', function() {
        this.trigger('choose-renderer', 'MIP');
    });
    handle('[name="choose-iso-renderer"]', function() {
        this.trigger('choose-renderer', 'ISO');
    });
    handle('[name="choose-eam-renderer"]', function() {
        this.trigger('choose-renderer', 'EAM');
    });
    handle('[name="choose-mcs-renderer"]', function() {
        this.trigger('choose-renderer', 'MCS');
    });
    handle('[name="choose-multiple-scattering-renderer"]', function() {
        this.trigger('choose-renderer', 'Multiple Scattering');
    });

    handle('[name="choose-range-tone-mapper"]', function() {
        this.trigger('choose-tone-mapper', 'Range');
    });
    handle('[name="choose-reinhard-tone-mapper"]', function() {
        this.trigger('choose-tone-mapper', 'Reinhard');
    });
    handle('[name="choose-artistic-tone-mapper"]', function() {
        this.trigger('choose-tone-mapper', 'Artistic');
    });
};

_.destroy = function() {
    DOMUtils.remove(this._html);
    this._$container = null;

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
