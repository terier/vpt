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

    _._init.call(this);
}

Class.defaults = {
    absorptionCoefficient : 1,
    scatteringCoefficient : 1,
    scatteringBias        : 0,
    majorant              : 2,
    maxBounces            : 8
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html                  = null;
    this._$heading               = null;
    this._$resizeHandle          = null;
    this._$closeButton           = null;

    this._$absorptionCoefficient = null;
    this._$scatteringCoefficient = null;
    this._$scatteringBias        = null;
    this._$majorant              = null;
    this._$maxBounces            = null;

    this._transferFunctionWidget = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['MultipleScatteringRendererDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$absorptionCoefficient = this._$html.find('[name="absorption-coefficient"]');
    this._$scatteringCoefficient = this._$html.find('[name="scattering-coefficient"]');
    this._$scatteringBias = this._$html.find('[name="scattering-bias"]');
    this._$majorant = this._$html.find('[name="majorant"]');
    this._$maxBounces = this._$html.find('[name="max-bounces"]');

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

    this._$absorptionCoefficient.val(this.absorptionCoefficient);
    this._$absorptionCoefficient.change(function() {
        this._renderer.absorptionCoefficient = parseFloat(this._$absorptionCoefficient.val());
    }.bind(this));

    this._$scatteringCoefficient.val(this.scatteringCoefficient);
    this._$scatteringCoefficient.change(function() {
        this._renderer.scatteringCoefficient = parseFloat(this._$scatteringCoefficient.val());
    }.bind(this));

    this._$scatteringBias.val(this.scatteringBias);
    this._$scatteringBias.change(function() {
        this._renderer.scatteringBias = parseFloat(this._$scatteringBias.val());
    }.bind(this));

    this._$majorant.val(this.majorant);
    this._$majorant.change(function() {
        this._renderer.majorant = parseFloat(this._$majorant.val());
    }.bind(this));

    this._$maxBounces.val(this.maxBounces);
    this._$maxBounces.change(function() {
        this._renderer.maxBounces = parseFloat(this._$maxBounces.val());
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

// ============================ STATIC METHODS ============================= //

})(this);
