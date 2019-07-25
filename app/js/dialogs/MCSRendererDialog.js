//@@../utils
//@@../Draggable.js
//@@../TransferFunctionWidget.js

(function(global) {
'use strict';

var Class = global.MCSRendererDialog = MCSRendererDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCSRendererDialog(container, renderer, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._renderer = renderer;

    _._init.call(this);
}

Class.defaults = {
    sigmaMax        : 1,
    alphaCorrection : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html                  = null;
    this._$heading               = null;
    this._$resizeHandle          = null;
    this._$closeButton           = null;
    this._$sigmaMax              = null;
    this._$alphaCorrection       = null;
    this._transferFunctionWidget = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['MCSRendererDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$sigmaMax = this._$html.querySelector('[name="sigma-max"]');
    this._$alphaCorrection = this._$html.querySelector('[name="alpha-correction"]');

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

    this._$sigmaMax.value = this.sigmaMax;
    this._$sigmaMax.addEventListener('change', function() {
        this._renderer._sigmaMax = parseFloat(this._$sigmaMax.value);
    }.bind(this));

    this._$alphaCorrection.value = this.alphaCorrection;
    this._$alphaCorrection.addEventListener('change', function() {
        this._renderer._alphaCorrection = parseFloat(this._$alphaCorrection.value);
    }.bind(this));

    var tfwContainer = this._$html.querySelector('.tfw-container');
    this._transferFunctionWidget = new TransferFunctionWidget(tfwContainer, {
        onChange: function() {
            this._renderer.reset();
            this._renderer.setTransferFunction(this._transferFunctionWidget.getTransferFunction());
        }.bind(this)
    });
};

_.destroy = function() {
    this._transferFunctionWidget.destroy();
    DOMUtils.remove(this._$html);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    DOMUtils.show(this._$html);
};

// ============================ STATIC METHODS ============================= //

})(this);
