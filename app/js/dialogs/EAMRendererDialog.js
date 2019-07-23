//@@../utils/Utils.js
//@@../Draggable.js
//@@../TransferFunctionWidget.js

(function(global) {
'use strict';

var Class = global.EAMRendererDialog = EAMRendererDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function EAMRendererDialog(container, renderer, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._renderer = renderer;

    _._init.call(this);
}

Class.defaults = {
    steps           : 10,
    alphaCorrection : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html                  = null;
    this._$heading               = null;
    this._$resizeHandle          = null;
    this._$closeButton           = null;
    this._$steps                 = null;
    this._$alphaCorrection       = null;
    this._transferFunctionWidget = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instatiate(TEMPLATES['EAMRendererDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$steps = this._$html.querySelector('[name="steps"]');
    this._$alphaCorrection = this._$html.querySelector('[name="alpha-correction"]');

    DOMUtils.hide(this._$html);
    this._$container.appendChild(this._$html);
    newDraggable(this._$html, this._$heading);
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
