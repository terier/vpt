//@@../utils
//@@../Draggable.js
//@@../TransferFunctionWidget.js

(function(global) {
    'use strict';

    var Class = global.MultipleScatteringRendererDialog = MultipleScatteringRendererDialog;
    var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MultipleScatteringRendererDialog(container, renderer, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;
    this._renderer = renderer;

    this._changeHandler = this._changeHandler.bind(this);

    _._init.call(this);
}

Class.defaults = {
    extinction     : 10,
    albedo         : 0.5,
    scatteringBias : 0,
    majorantRatio  : 1,
    maxBounces     : 8,
    steps          : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html           = null;
    this._$heading        = null;
    this._$resizeHandle   = null;
    this._$closeButton    = null;

    this._$extinction     = null;
    this._$albedo         = null;
    this._$scatteringBias = null;
    this._$majorantRatio  = null;
    this._$maxBounces     = null;

    this._transferFunctionWidget = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = DOMUtils.instantiate(TEMPLATES['MultipleScatteringRendererDialog.html']);
    this._$heading = this._$html.querySelector('.panel-heading');
    this._$resizeHandle = this._$html.querySelector('.resize-handle');
    this._$closeButton = this._$html.querySelector('.close');

    this._$extinction = this._$html.querySelector('[name="extinction"]');
    this._$albedo = this._$html.querySelector('[name="albedo"]');
    this._$scatteringBias = this._$html.querySelector('[name="scattering-bias"]');
    this._$majorantRatio = this._$html.querySelector('[name="majorant-ratio"]');
    this._$maxBounces = this._$html.querySelector('[name="max-bounces"]');
    this._$steps = this._$html.querySelector('[name="steps"]');

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

    this._$extinction.value = this.extinction;
    this._$extinction.addEventListener('change', this._changeHandler);

    this._$albedo.value = this.albedo;
    this._$albedo.addEventListener('change', this._changeHandler);

    this._$majorantRatio.value = this.majorantRatio;
    this._$majorantRatio.addEventListener('change', this._changeHandler);

    this._$scatteringBias.value = this.scatteringBias;
    this._$scatteringBias.addEventListener('change', function() {
        this._renderer.scatteringBias = parseFloat(this._$scatteringBias.value);
        this._renderer.reset();
    }.bind(this));

    this._$maxBounces.value = this.maxBounces;
    this._$maxBounces.addEventListener('change', function() {
        this._renderer.maxBounces = parseFloat(this._$maxBounces.value);
        this._renderer.reset();
    }.bind(this));

    this._$steps.value = this.steps;
    this._$steps.addEventListener('change', function() {
        this._renderer.steps = parseInt(this._$steps.value);
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

_._changeHandler = function() {
    var extinction = parseFloat(this._$extinction.value);
    var albedo = parseFloat(this._$albedo.value);
    var majorantRatio = parseFloat(this._$majorantRatio.value);

    this._renderer.absorptionCoefficient = extinction * (1 - albedo);
    this._renderer.scatteringCoefficient = extinction * albedo;
    this._renderer.majorant = extinction * majorantRatio;
    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
