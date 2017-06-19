var OpenFileDialog = (function() {
'use strict';

function OpenFileDialog(container, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);

    this._$html  = $(TEMPLATES["OpenFileDialog.html"]);
    this._$input = this._$html.find('[name="file"]')[0];
    this._$size  = this._$html.find('[name="size"]');
    this._$bits  = this._$html.find('[name="bits"]');
    this._$open  = this._$html.find('[name="open"]');
    this._$close = this._$html.find('[name="close"]');

    this._onLoad = this._opts.onLoad;
    this._onError = this._opts.onError;

    this._init();
}

OpenFileDialog.defaults = {
};

var _ = OpenFileDialog.prototype;

_._init = function() {
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
            reader.onload = function(e) {
                this._onLoad(e.target.result, size, bits);
            }.bind(this);
            reader.onerror = this._onError;
            reader.readAsArrayBuffer(file);
        }
    }.bind(this));
};

_.destroy = function() {
};

_.show = function() {
    this._$html.modal('show');
};

return OpenFileDialog;

})();
