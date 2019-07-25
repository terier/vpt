//@@../utils
//@@../Draggable.js

(function(global) {
'use strict';

var Class = global.ISORendererDialog = ISORendererDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ISORendererDialog(container, renderer, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._renderer = renderer;

    _._init.call(this);
}

Class.defaults = {
    steps           : 10,
    isovalue        : 0.5,
    diffuseColor    : '#ffffff',
    lightDirectionX : 1,
    lightDirectionY : 0,
    lightDirectionZ : 0
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$steps        = null;
    this._$isovalue     = null;
    this._$color        = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['ISORendererDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$steps = this._$html.querySelector('[name="steps"]');
    this._$isovalue = this._$html.querySelector('[name="isovalue"]');
    this._$color = this._$html.querySelector('[name="color"]');

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

    this._$steps.value = this.steps;
    this._$steps.addEventListener('change', function() {
        this._renderer._stepSize = 1 / parseInt(this._$steps.value);
    }.bind(this));

    this._$isovalue.value = this.isovalue;
    this._$isovalue.addEventListener('change', function() {
        this._renderer._isovalue = parseFloat(this._$isovalue.value);
    }.bind(this));

    this._$color.value = this.diffuseColor;
    this._$color.addEventListener('change', function() {
        var color = this._$color.value;
        this._renderer._diffuse[0] = parseInt(color.substr(1, 3), 16) / 255;
        this._renderer._diffuse[1] = parseInt(color.substr(3, 5), 16) / 255;
        this._renderer._diffuse[2] = parseInt(color.substr(5, 7), 16) / 255;
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
