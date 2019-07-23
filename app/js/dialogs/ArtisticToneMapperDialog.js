//@@../utils/Utils.js
//@@../Draggable.js

(function(global) {
'use strict';

var Class = global.ArtisticToneMapperDialog = ArtisticToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ArtisticToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._toneMapper = toneMapper;

    this._updateToneMapper = this._updateToneMapper.bind(this);

    _._init.call(this);
}

Class.defaults = {
    low        : 0,
    mid        : 0.5,
    high       : 1,
    saturation : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html           = null;
    this._$heading        = null;
    this._$resizeHandle   = null;
    this._$closeButton    = null;
    this._$low            = null;
    this._$mid            = null;
    this._$high           = null;
    this._$saturation     = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['ArtisticToneMapperDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$low = this._$html.querySelector('[name="low"]');
    this._$mid = this._$html.querySelector('[name="mid"]');
    this._$high = this._$html.querySelector('[name="high"]');
    this._$saturation = this._$html.querySelector('[name="saturation"]');

    this._$container.appendChild(this._$html);
    DOMUtils.hide(this._$html);
    new Draggable(this._$html, this._$heading);
    /*this._$html.resizable({
        handles: {
            se: this._$resizeHandle
        }
    });*/
    this._$closeButton.addEventListener('click', function() {
        DOMUtils.hide(this._$html);
    }.bind(this));

    this._$low.value = this.low;
    this._$mid.value = this.mid;
    this._$high.value = this.high;
    this._$saturation.value = this.saturation;
    this._$low.addEventListener('change', this._updateToneMapper);
    this._$mid.addEventListener('change', this._updateToneMapper);
    this._$high.addEventListener('change', this._updateToneMapper);
    this._$saturation.addEventListener('change', this._updateToneMapper);
};

_.destroy = function() {
    DOMUtils.remove(this._$html);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    DOMUtils.show(this._$html);
};

_._updateToneMapper = function() {
    this._toneMapper.low = parseFloat(this._$low.value);
    this._toneMapper.mid = parseFloat(this._$mid.value);
    this._toneMapper.high = parseFloat(this._$high.value);
    this._toneMapper.saturation = parseFloat(this._$saturation.value);
};

// ============================ STATIC METHODS ============================= //

})(this);
