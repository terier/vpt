(function(global) {
'use strict';

var Class = global.RenderingContextDialog = RenderingContextDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RenderingContextDialog(container, renderingContext, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._renderingContext = renderingContext;

    _._init.call(this);
}

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$scale        = null;
    this._$translation  = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['RenderingContextDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$scale = this._$html.find('[name="scale"]');
    this._$translation = this._$html.find('[name="translation"]');

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

    var translation = this._renderingContext.getTranslation();
    this._$translation.filter('[data-axis="x"]').val(translation.x);
    this._$translation.filter('[data-axis="y"]').val(translation.y);
    this._$translation.filter('[data-axis="z"]').val(translation.z);
    this._$translation.change(function() {
        var x = parseFloat(this._$translation.filter('[data-axis="x"]').val());
        var y = parseFloat(this._$translation.filter('[data-axis="y"]').val());
        var z = parseFloat(this._$translation.filter('[data-axis="z"]').val());
        this._renderingContext.setTranslation(x, y, z);
    }.bind(this));

    var scale = this._renderingContext.getScale();
    this._$scale.filter('[data-axis="x"]').val(scale.x);
    this._$scale.filter('[data-axis="y"]').val(scale.y);
    this._$scale.filter('[data-axis="z"]').val(scale.z);
    this._$scale.change(function() {
        var x = parseFloat(this._$scale.filter('[data-axis="x"]').val());
        var y = parseFloat(this._$scale.filter('[data-axis="y"]').val());
        var z = parseFloat(this._$scale.filter('[data-axis="z"]').val());
        this._renderingContext.setScale(x, y, z);
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
