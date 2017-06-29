var ISORendererController = (function() {
'use strict';

function ISORendererController(container, renderer, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);
    this._renderer = renderer;

    this._$html  = $(TEMPLATES['ISORendererController.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$steps = this._$html.find('[name="steps"]');
    this._$isovalue = this._$html.find('[name="isovalue"]');
    this._$color = this._$html.find('[name="color"]');

    _._init.call(this);
}

ISORendererController.defaults = {
    steps: 10,
    isovalue: 0.5,
    diffuseColor: '#ffffff',
    lightDirectionX: 1,
    lightDirectionY: 0,
    lightDirectionZ: 0
};

var _ = ISORendererController.prototype;

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

    this._$isovalue.val(this._opts.isovalue);
    this._$isovalue.change(function() {
        this._renderer._isovalue = parseFloat(this._$isovalue.val());
    }.bind(this));

    this._$color.val(this._opts.diffuseColor);
    this._$color.change(function() {
        var color = this._$color.val();
        console.log(color);
        this._renderer._diffuse[0] = parseInt(color.substr(1, 2), 16) / 255;
        this._renderer._diffuse[1] = parseInt(color.substr(3, 2), 16) / 255;
        this._renderer._diffuse[2] = parseInt(color.substr(5, 2), 16) / 255;
    }.bind(this));
};

_.destroy = function() {
    this._$html.remove();
};

_.show = function() {
    this._$html.show();
};

return ISORendererController;

})();
