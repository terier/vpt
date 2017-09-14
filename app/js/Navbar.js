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
    onOpenFile                 : null,
    onResetRenderer            : null,
    onMipRendererDialog        : null,
    onIsoRendererDialog        : null,
    onEamRendererDialog        : null,
    onReinhardToneMapperDialog : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html                     = null;
    this._$openFile                 = null;
    this._$resetRenderer            = null;
    this._$mipRendererDialog        = null;
    this._$isoRendererDialog        = null;
    this._$eamRendererDialog        = null;
    this._$reinhardToneMapperDialog = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['Navbar.html']);
    this._$openFile = this._$html.find('[name="open-file-button"]');
    this._$resetRenderer = this._$html.find('[name="reset-renderer-button"]');
    this._$mipRendererDialog = this._$html.find('[name="mip-renderer-dialog-button"]');
    this._$isoRendererDialog = this._$html.find('[name="iso-renderer-dialog-button"]');
    this._$eamRendererDialog = this._$html.find('[name="eam-renderer-dialog-button"]');
    this._$reinhardToneMapperDialog = this._$html.find('[name="reinhard-tone-mapper-dialog-button"]');

    this._$container.append(this._$html);
    this._$openFile.click(this.onOpenFile);
    this._$resetRenderer.click(this.onResetRenderer);
    this._$mipRendererDialog.click(this.onMipRendererDialog);
    this._$isoRendererDialog.click(this.onIsoRendererDialog);
    this._$eamRendererDialog.click(this.onEamRendererDialog);
    this._$reinhardToneMapperDialog.click(this.onReinhardToneMapperDialog);
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
