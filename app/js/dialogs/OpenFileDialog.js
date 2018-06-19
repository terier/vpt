(function(global) {
'use strict';

var Class = global.OpenFileDialog = OpenFileDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function OpenFileDialog(container, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);

    _._init.call(this);
}

Class.defaults = {
    onLoad  : null,
    onError : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html  = null;
    this._$input = null;
    this._$size  = null;
    this._$bits  = null;
    this._$open  = null;
    this._$close = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html  = $(TEMPLATES['OpenFileDialog.html']);
    this._$input = this._$html.find('[name="file"]')[0];
    this._$size  = this._$html.find('[name="size"]');
    this._$bits  = this._$html.find('[name="bits"]');
    this._$open  = this._$html.find('[name="open"]');
    this._$close = this._$html.find('[name="close"]');

    this._$html.modal({
        show: false
    });
    this._$container.append(this._$html);
    this._$open.click(function() {
        if (this._$input.files.length > 0) {
            var file = this._$input.files[0];
            var size = {
                x: parseInt(this._$size.filter('[data-axis="x"]').val()),
                y: parseInt(this._$size.filter('[data-axis="y"]').val()),
                z: parseInt(this._$size.filter('[data-axis="z"]').val())
            };
            var bits = parseInt(this._$bits.filter(':checked').val());
            var reader = new FileReader();
            reader.addEventListener('load', function(e) {
                this.onLoad(e.target.result, size, bits);
            }.bind(this));
            reader.addEventListener('error', this.onError);
            reader.readAsArrayBuffer(file);
        }
    }.bind(this));
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    this._$html.modal('show');
};

// ============================ STATIC METHODS ============================= //

})(this);
