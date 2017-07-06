var EAMRendererController = (function() {
'use strict';

function EAMRendererController(container, renderer, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);
    this._renderer = renderer;

    this._$html  = $(TEMPLATES['EAMRendererController.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$steps = this._$html.find('[name="steps"]');
    this._$alphaCorrection = this._$html.find('[name="alpha-correction"]');

    _._init.call(this);
}

EAMRendererController.defaults = {
    steps: 10,
    alphaCorrection: 1
};

var _ = EAMRendererController.prototype;

_._init = function() {
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

    this._$steps.val(this._opts.steps);
    this._$steps.change(function() {
        this._renderer._stepSize = 1 / parseInt(this._$steps.val(), 10);
    }.bind(this));

    this._$alphaCorrection.val(this._opts.alphaCorrection);
    this._$alphaCorrection.change(function() {
        this._renderer._alphaCorrection = parseFloat(this._$alphaCorrection.val());
    }.bind(this));
};

_.destroy = function() {
    this._$html.remove();
};

_.show = function() {
    this._$html.show();
};

return EAMRendererController;

})();
