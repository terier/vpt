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

    this._$container = $(container);

    _._init.call(this);
}

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html = null;
    this._eventHandlers = {};
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['Navbar.html']);
    this._$container.append(this._$html);

    this._$html.find('[name="open-file-dialog"]').click(function() {
        this.trigger('open-file-dialog');
    }.bind(this));
    this._$html.find('[name="open-environment-map-dialog"]').click(function() {
        this.trigger('open-environment-map-dialog');
    }.bind(this));

    this._$html.find('[name="reset-renderer"]').click(function() {
        this.trigger('reset-renderer');
    }.bind(this));
    this._$html.find('[name="rendering-context-dialog"]').click(function() {
        this.trigger('rendering-context-dialog');
    }.bind(this));
    this._$html.find('[name="renderer-settings-dialog"]').click(function() {
        this.trigger('renderer-settings-dialog');
    }.bind(this));
    this._$html.find('[name="tone-mapper-settings-dialog"]').click(function() {
        this.trigger('tone-mapper-settings-dialog');
    }.bind(this));

    this._$html.find('[name="choose-mip-renderer"]').click(function() {
        this.trigger('choose-renderer', 'MIP');
    }.bind(this));
    this._$html.find('[name="choose-iso-renderer"]').click(function() {
        this.trigger('choose-renderer', 'ISO');
    }.bind(this));
    this._$html.find('[name="choose-eam-renderer"]').click(function() {
        this.trigger('choose-renderer', 'EAM');
    }.bind(this));
    this._$html.find('[name="choose-mcs-renderer"]').click(function() {
        this.trigger('choose-renderer', 'MCS');
    }.bind(this));
    this._$html.find('[name="choose-multiple-scattering-renderer"]').click(function() {
        this.trigger('choose-renderer', 'Multiple Scattering');
    }.bind(this));

    this._$html.find('[name="choose-range-tone-mapper"]').click(function() {
        this.trigger('choose-tone-mapper', 'Range');
    }.bind(this));
    this._$html.find('[name="choose-reinhard-tone-mapper"]').click(function() {
        this.trigger('choose-tone-mapper', 'Reinhard');
    }.bind(this));
    this._$html.find('[name="choose-artistic-tone-mapper"]').click(function() {
        this.trigger('choose-tone-mapper', 'Artistic');
    }.bind(this));
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
