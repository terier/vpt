(function(global) {
'use strict';

var Class = global.Navbar = Navbar;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Navbar(container, options) {
    $.extend(this, Class.defaults, options);

    this._$container = $(container);

    _._init.call(this);
}

Class.defaults = {
    onOpenFile              : null,
    onResetRenderer         : null,
    onMipRendererController : null,
    onIsoRendererController : null,
    onEamRendererController : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html                  = null;
    this._$openFile              = null;
    this._$resetRenderer         = null;
    this._$mipRendererController = null;
    this._$isoRendererController = null;
    this._$eamRendererController = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['Navbar.html']);
    this._$openFile = this._$html.find('[name="open-file-button"]');
    this._$resetRenderer = this._$html.find('[name="reset-renderer-button"]');
    this._$mipRendererController = this._$html.find('[name="mip-renderer-controller-button"]');
    this._$isoRendererController = this._$html.find('[name="iso-renderer-controller-button"]');
    this._$eamRendererController = this._$html.find('[name="eam-renderer-controller-button"]');

    this._$container.append(this._$html);
    this._$openFile.click(this.onOpenFile);
    this._$resetRenderer.click(this.onResetRenderer);
    this._$mipRendererController.click(this.onMipRendererController);
    this._$isoRendererController.click(this.onIsoRendererController);
    this._$eamRendererController.click(this.onEamRendererController);
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
