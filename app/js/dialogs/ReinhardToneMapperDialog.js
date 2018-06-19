(function(global) {
'use strict';

var Class = global.ReinhardToneMapperDialog = ReinhardToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ReinhardToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._toneMapper = toneMapper;

    _._init.call(this);
}

Class.defaults = {
    exposure : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$exposure     = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['ReinhardToneMapperDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$exposure = this._$html.find('[name="exposure"]');

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

    this._$exposure.val(this.exposure);
    this._$exposure.change(function() {
        this._toneMapper._exposure = parseFloat(this._$exposure.val());
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
