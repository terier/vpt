//@@../utils

(function(global) {
'use strict';

var Class = global.OpenEnvironmentMapDialog = OpenEnvironmentMapDialog;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function OpenEnvironmentMapDialog(container, options) {
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
    this._$open  = null;
    this._$close = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html  = DOMUtils.instantiate(TEMPLATES['OpenEnvironmentMapDialog.html']);
    this._$input = this._$html.querySelector('[name="file"]')[0];
    this._$open  = this._$html.querySelector('[name="open"]');
    this._$close = this._$html.querySelector('[name="close"]');

    /*this._$html.modal({
        show: false
    });*/
    this._$container.appendChild(this._$html);
    this._$open.addEventListener('click', function() {
        if (this._$input.files.length > 0) {
            var file = this._$input.files[0];
            var image = new Image();
            var reader = new FileReader();

            var onImageLoad = function() {
                image.removeEventListener('load', onImageLoad);
                this.onLoad(image);
            }.bind(this);

            var onReaderLoad = function() {
                image.src = reader.result;
            };

            image.addEventListener('load', onImageLoad);
            reader.addEventListener('load', onReaderLoad);
            reader.addEventListener('error', this.onError);
            reader.readAsDataURL(file);
        }
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
