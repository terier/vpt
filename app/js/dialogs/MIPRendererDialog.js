(function(global) {
'use strict';

var Class = global.MIPRendererDialog = MIPRendererDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MIPRendererDialog(container, renderer, options) {
    $.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._renderer = renderer;

    _._init.call(this);
}

Class.defaults = {
    steps : 10
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$steps        = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['MIPRendererDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

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

    this._$steps.val(this.steps);
    this._$steps.change(function() {
        this._renderer._stepSize = 1 / parseInt(this._$steps.val(), 10);
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
