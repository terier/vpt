(function(global) {
'use strict';

var Class = global.RangeToneMapperDialog = RangeToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RangeToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._toneMapper = toneMapper;

    _._init.call(this);
}

Class.defaults = {
    min : 0,
    max : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html         = null;
    this._$heading      = null;
    this._$resizeHandle = null;
    this._$closeButton  = null;
    this._$min          = null;
    this._$max          = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['RangeToneMapperDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$min = this._$html.find('[name="min"]');
    this._$max = this._$html.find('[name="max"]');

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

    this._$min.val(this.min);
    this._$min.change(function() {
        this._toneMapper._min = parseFloat(this._$min.val());
    }.bind(this));

    this._$max.val(this.max);
    this._$max.change(function() {
        this._toneMapper._max = parseFloat(this._$max.val());
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
