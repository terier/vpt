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
    this._$drop  = this._$html.find('.drop');
    this._$input = this._$html.find('[name="file"]');
    this._$size  = this._$html.find('[name="size"]');
    this._$bits  = this._$html.find('[name="bits"]');
    this._$open  = this._$html.find('[name="open"]');
    this._$close = this._$html.find('[name="close"]');

    this._$html.modal({
        show: false
    });
    this._$container.append(this._$html);
    this._$open.click(function() {
        if (this._$input[0].files.length > 0) {

        }
    }.bind(this));

    this._$drop.on('dragover', function(e) {
        e.preventDefault();
    }.bind(this));
    this._$drop.on('drop', function(e) {
        e.preventDefault();
        this._$input[0].files = e.originalEvent.dataTransfer.files;
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
