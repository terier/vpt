var Navbar = (function() {
'use strict';

function Navbar(container, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._$container = $(container);

    this._$html = $(TEMPLATES['Navbar.html']);
    this._$openFile = this._$html.find('[name="open-file-button"]');
    this._$resetRenderer = this._$html.find('[name="reset-renderer-button"]');
    this._$mipRendererController = this._$html.find('[name="mip-renderer-controller-button"]');
    this._$isoRendererController = this._$html.find('[name="iso-renderer-controller-button"]');
    this._$eamRendererController = this._$html.find('[name="eam-renderer-controller-button"]');

    this._onOpenFile = this._opts.onOpenFile;
    this._onResetRenderer = this._opts.onResetRenderer;
    this._onMipRendererController = this._opts.onMipRendererController;
    this._onIsoRendererController = this._opts.onIsoRendererController;
    this._onEamRendererController = this._opts.onEamRendererController;

    _._init.call(this);
}

Navbar.defaults = {
};

var _ = Navbar.prototype;

_._init = function() {
    this._$container.append(this._$html);
    this._$openFile.click(this._opts.onOpenFile);
    this._$resetRenderer.click(this._opts.onResetRenderer);
    this._$mipRendererController.click(this._opts.onMipRendererController);
    this._$isoRendererController.click(this._opts.onIsoRendererController);
    this._$eamRendererController.click(this._opts.onEamRendererController);
};

_.destroy = function() {
    this._$html.remove();
};

return Navbar;

})();
