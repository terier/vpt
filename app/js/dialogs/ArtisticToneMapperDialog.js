(function(global) {
'use strict';

var Class = global.ArtisticToneMapperDialog = ArtisticToneMapperDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ArtisticToneMapperDialog(container, toneMapper, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);
    this._toneMapper = toneMapper;

    this._updateToneMapper = this._updateToneMapper.bind(this);

    _._init.call(this);
}

Class.defaults = {
    low        : 0,
    mid        : 0.5,
    high       : 1,
    saturation : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html           = null;
    this._$heading        = null;
    this._$resizeHandle   = null;
    this._$closeButton    = null;
    this._$low            = null;
    this._$mid            = null;
    this._$high           = null;
    this._$saturation     = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['ArtisticToneMapperDialog.html']);
    this._$heading = this._$html.find('.panel-heading');
    this._$resizeHandle = this._$html.find('.resize-handle');
    this._$closeButton = this._$html.find('.close');

    this._$low = this._$html.find('[name="low"]');
    this._$mid = this._$html.find('[name="mid"]');
    this._$high = this._$html.find('[name="high"]');
    this._$saturation = this._$html.find('[name="saturation"]');

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

    this._$low.val(this.low);
    this._$low.change(this._updateToneMapper);
    this._$mid.val(this.mid);
    this._$mid.change(this._updateToneMapper);
    this._$high.val(this.high);
    this._$high.change(this._updateToneMapper);
    this._$saturation.val(this.saturation);
    this._$saturation.change(this._updateToneMapper);
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    this._$html.show();
};

_._updateToneMapper = function() {
    this._toneMapper.low = parseFloat(this._$low.val());
    this._toneMapper.mid = parseFloat(this._$mid.val());
    this._toneMapper.high = parseFloat(this._$high.val());
    this._toneMapper.saturation = parseFloat(this._$saturation.val());
};

// ============================ STATIC METHODS ============================= //

})(this);
