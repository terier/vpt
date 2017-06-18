var Navbar = (function() {
'use strict';

function Navbar(element, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$element = $(element);

    this._$html = $(TEMPLATES["Navbar.html"]);
    this._$openFile = this._$html.find('[name="open-file"]');
    this._$resetRenderer = this._$html.find('[name="reset-renderer"]');

    this._onOpenFile = this._opts.onOpenFile;
    this._onResetRenderer = this._opts.onResetRenderer;

    this._init();
}

Navbar.defaults = {
};

var _ = Navbar.prototype;

_._init = function() {
    this._$element.append(this._$html);
    this._$openFile.click(this._opts.onOpenFile);
    this._$resetRenderer.click(this._opts.onResetRenderer);
};

_.destroy = function() {
    this._$html.remove();
};

return Navbar;

})();
