//@@../utils
//@@../Draggable.js

(function(global) {
'use strict';

var Class = global.RenderingContextDialog = RenderingContextDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RenderingContextDialog(container, renderingContext, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._renderingContext = renderingContext;

    this._handleTranslationChange = this._handleTranslationChange.bind(this);
    this._handleScaleChange = this._handleScaleChange.bind(this);

    _._init.call(this);
}

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$resolution   = null;
    this._$translationX = null;
    this._$translationY = null;
    this._$translationZ = null;
    this._$scaleX       = null;
    this._$scaleY       = null;
    this._$scaleZ       = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES.RenderingContextDialog);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$resolution = this._$html.querySelector('[name="resolution"]');

    this._$translationX = this._$html.querySelector('[name="translation"][data-axis="x"]');
    this._$translationY = this._$html.querySelector('[name="translation"][data-axis="y"]');
    this._$translationZ = this._$html.querySelector('[name="translation"][data-axis="z"]');

    this._$scaleX = this._$html.querySelector('[name="scale"][data-axis="x"]');
    this._$scaleY = this._$html.querySelector('[name="scale"][data-axis="y"]');
    this._$scaleZ = this._$html.querySelector('[name="scale"][data-axis="z"]');

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

    var resolution = this._renderingContext.getResolution();
    this._$resolution.value = resolution;
    this._$resolution.addEventListener('change', function() {
        var resolution = parseInt(this._$resolution.value);
        this._renderingContext.setResolution(resolution);
    }.bind(this));

    var translation = this._renderingContext.getTranslation();
    this._$translationX.value = translation.x;
    this._$translationY.value = translation.y;
    this._$translationZ.value = translation.z;
    this._$translationX.addEventListener('change', this._handleTranslationChange);
    this._$translationY.addEventListener('change', this._handleTranslationChange);
    this._$translationZ.addEventListener('change', this._handleTranslationChange);

    var scale = this._renderingContext.getScale();
    this._$scaleX.value = scale.x;
    this._$scaleY.value = scale.y;
    this._$scaleZ.value = scale.z;
    this._$scaleX.addEventListener('change', this._handleScaleChange);
    this._$scaleY.addEventListener('change', this._handleScaleChange);
    this._$scaleZ.addEventListener('change', this._handleScaleChange);
};

_.destroy = function() {
    DOMUtils.remove(this._$html);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    DOMUtils.show(this._$html);
};

_._handleTranslationChange = function() {
    var x = parseFloat(this._$translationX.value);
    var y = parseFloat(this._$translationY.value);
    var z = parseFloat(this._$translationZ.value);
    this._renderingContext.setTranslation(x, y, z);
};

_._handleScaleChange = function() {
    var x = parseFloat(this._$scaleX.value);
    var y = parseFloat(this._$scaleY.value);
    var z = parseFloat(this._$scaleZ.value);
    this._renderingContext.setScale(x, y, z);
};

// ============================ STATIC METHODS ============================= //

})(this);
