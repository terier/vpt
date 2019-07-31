//@@../utils

(function(global) {
'use strict';

var Class = global.OpenFileDialog = OpenFileDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function OpenFileDialog(container, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = container;

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

    this._$html  = DOMUtils.instantiate(TEMPLATES.OpenFileDialog);
    this._$drop  = this._$html.querySelector('.drop');
    this._$input = this._$html.querySelector('[name="file"]');
    this._$size  = this._$html.querySelector('[name="size"]');
    this._$bits  = this._$html.querySelector('[name="bits"]');
    this._$open  = this._$html.querySelector('[name="open"]');
    this._$close = this._$html.querySelector('[name="close"]');

    /*this._$html.modal({
        show: false
    });*/
    this._$container.appendChild(this._$html);
    this._$open.addEventListener('click', function() {
        if (this._$input[0].files.length > 0) {
            var data = this._$input[0].files[0];
            var size = {
                x: parseInt(this._$size.querySelector('[data-axis="x"]').value),
                y: parseInt(this._$size.querySelector('[data-axis="y"]').value),
                z: parseInt(this._$size.querySelector('[data-axis="z"]').value)
            };
            var bits = parseInt(this._$bits.querySelector(':checked').value);
            this.onLoad && this.onLoad(data, size, bits);
        }
    }.bind(this));

    this._$drop.addEventListener('dragover', function(e) {
        e.preventDefault();
    }.bind(this));
    this._$drop.addEventListener('drop', function(e) {
        e.preventDefault();
        this._$input[0].files = e.dataTransfer.files;
    }.bind(this));
};

_.destroy = function() {
    DOMUtils.remove(this._$html);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.show = function() {
    //this._$html.modal('show');
};

// ============================ STATIC METHODS ============================= //

})(this);
