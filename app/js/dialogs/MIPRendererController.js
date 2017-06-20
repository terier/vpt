var MIPRendererController = (function() {
'use strict';

function MIPRendererController(container, renderer, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);
    this._renderer = renderer;

    this._$html  = $(TEMPLATES['MIPRendererController.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$steps = this._$html.find('[name="steps"]');

    this._init();
}

MIPRendererController.defaults = {
    steps: 10
};

var _ = MIPRendererController.prototype;

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
};

_.destroy = function() {
    this._$html.remove();
};

_.show = function() {
    this._$html.show();
};

return MIPRendererController;

})();
