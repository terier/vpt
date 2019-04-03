//@@../TransferFunctionWidget.js

(function(global) {
    'use strict';

    var Class = global.MultipleScatteringRendererDialog = MultipleScatteringRendererDialog;
    var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MultipleScatteringRendererDialog(container, renderer, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);
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

    this._$html = $(TEMPLATES['MultipleScatteringRendererDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$extinction = this._$html.find('[name="extinction"]');
    this._$albedo = this._$html.find('[name="albedo"]');
    this._$scatteringBias = this._$html.find('[name="scattering-bias"]');
    this._$majorantRatio = this._$html.find('[name="majorant-ratio"]');
    this._$maxBounces = this._$html.find('[name="max-bounces"]');
    this._$steps = this._$html.find('[name="steps"]');

    this._$html.hide();
    this._$container.append(this._$html);
    this._$html.draggable({
        handle: this._$heading
    });
    this._$html.resizable({
        handles: {
            se: this._$resizeHandle
        }
    });
    this._$closeButton.click(function() {
        this._$html.hide();
    }.bind(this));

    this._$extinction.val(this.extinction);
    this._$extinction.change(this._changeHandler);

    this._$albedo.val(this.albedo);
    this._$albedo.change(this._changeHandler);

    this._$majorantRatio.val(this.majorantRatio);
    this._$majorantRatio.change(this._changeHandler);

    this._$scatteringBias.val(this.scatteringBias);
    this._$scatteringBias.change(function() {
        this._renderer.scatteringBias = parseFloat(this._$scatteringBias.val());
        this._renderer.reset();
    }.bind(this));

    this._$maxBounces.val(this.maxBounces);
    this._$maxBounces.change(function() {
        this._renderer.maxBounces = parseFloat(this._$maxBounces.val());
        this._renderer.reset();
    }.bind(this));

    this._$steps.val(this.steps);
    this._$steps.change(function() {
        this._renderer.steps = parseInt(this._$steps.val());
    }.bind(this));

    var tfwContainer = this._$html.find('.tfw-container');
    this._transferFunctionWidget = new TransferFunctionWidget(tfwContainer, {
        onChange: function() {
            this._renderer.reset();
            this._renderer.setTransferFunction(this._transferFunctionWidget.getTransferFunction());
        }.bind(this)
    });
};

_.destroy = function() {
    this._transferFunctionWidget.destroy();
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    this._$html.show();
};

_._changeHandler = function() {
    var extinction = parseFloat(this._$extinction.val());
    var albedo = parseFloat(this._$albedo.val());
    var majorantRatio = parseFloat(this._$majorantRatio.val());

    this._renderer.absorptionCoefficient = extinction * (1 - albedo);
    this._renderer.scatteringCoefficient = extinction * albedo;
    this._renderer.majorant = extinction * majorantRatio;
    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
