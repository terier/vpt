//@@../utils/Utils.js
//@@../Draggable.js

(function(global) {
'use strict';

var Class = global.RangeToneMapperDialog = RangeToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RangeToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._toneMapper = toneMapper;

    _._init.call(this);
}

Class.defaults = {
    min : 0,
    max : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$min          = null;
    this._$max          = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['RangeToneMapperDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$min = this._$html.querySelector('[name="min"]');
    this._$max = this._$html.querySelector('[name="max"]');

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

    this._$min.val(this.min);
    this._$min.addEventListener('change', function() {
        this._toneMapper._min = parseFloat(this._$min.value);
    }.bind(this));

    this._$max.val(this.max);
    this._$max.addEventListener('change', function() {
        this._toneMapper._max = parseFloat(this._$max.value);
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
