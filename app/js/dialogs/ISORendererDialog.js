(function(global) {
'use strict';

var Class = global.ISORendererDialog = ISORendererDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ISORendererDialog(container, renderer, options) {
    $.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._renderer = renderer;

    _._init.call(this);
}

Class.defaults = {
    steps           : 10,
    isovalue        : 0.5,
    diffuseColor    : '#ffffff',
    lightDirectionX : 1,
    lightDirectionY : 0,
    lightDirectionZ : 0
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$steps        = null;
    this._$isovalue     = null;
    this._$color        = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['ISORendererDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$steps = this._$html.find('[name="steps"]');
    this._$isovalue = this._$html.find('[name="isovalue"]');
    this._$color = this._$html.find('[name="color"]');

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

    this._$steps.val(this.steps);
    this._$steps.change(function() {
        this._renderer._stepSize = 1 / parseInt(this._$steps.val(), 10);
    }.bind(this));

    this._$isovalue.val(this.isovalue);
    this._$isovalue.change(function() {
        this._renderer._isovalue = parseFloat(this._$isovalue.val());
    }.bind(this));

    this._$color.val(this.diffuseColor);
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

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    this._$html.show();
};

// ============================ STATIC METHODS ============================= //

})(this);
