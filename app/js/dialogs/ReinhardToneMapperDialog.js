//@@../utils/Utils.js
//@@../Draggable.js

(function(global) {
'use strict';

var Class = global.ReinhardToneMapperDialog = ReinhardToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ReinhardToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._toneMapper = toneMapper;

    _._init.call(this);
}

Class.defaults = {
    exposure : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$exposure     = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['ReinhardToneMapperDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$exposure = this._$html.querySelector('[name="exposure"]');

    DOMUtils.hide(this._$html);
    this._$container.appendChild(this._$html);
    new Draggable(this._$html, this._$heading);
    /*this._$html.resizable({
        handles: {
            se: this._$resizeHandle
        }
    });*/
    this._$closeButton.addEventListener('click', function() {
        DOMUtils.hide(this._$html);
    }.bind(this));

    this._$exposure.value = this.exposure;
    this._$exposure.addEventListener('change', function() {
        this._toneMapper._exposure = parseFloat(this._$exposure.value);
    }.bind(this));
};

_.destroy = function() {
    DOMUtils.remove(this._$html);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    DOMUtils.show(this._$html);
};

// ============================ STATIC METHODS ============================= //

})(this);
