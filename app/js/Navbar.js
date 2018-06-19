(function(global) {
'use strict';

var Class = global.Navbar = Navbar;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Navbar(container, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._$container = $(container);

    _._init.call(this);
}

Class.defaults = {
    onOpenFileDialog           : null,
    onOpenEnvironmentMapDialog : null,
    onResetRenderer            : null,
    onRenderingContextDialog   : null,
    onMipRendererDialog        : null,
    onIsoRendererDialog        : null,
    onEamRendererDialog        : null,
    onMcsRendererDialog        : null,
    onReinhardToneMapperDialog : null,
    onRangeToneMapperDialog    : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._$html = null;
};

_._init = function() {
    _._nullify.call(this);

    this._$html = $(TEMPLATES['Navbar.html']);
    this._$container.append(this._$html);

    this._$html.find('[name="open-file-dialog-button"]').click(this.onOpenFileDialog);
    this._$html.find('[name="open-environment-map-dialog-button"]').click(this.onOpenEnvironmentMapDialog);
    this._$html.find('[name="reset-renderer-button"]').click(this.onResetRenderer);
    this._$html.find('[name="rendering-context-dialog-button"]').click(this.onRenderingContextDialog);
    this._$html.find('[name="mip-renderer-dialog-button"]').click(this.onMipRendererDialog);
    this._$html.find('[name="iso-renderer-dialog-button"]').click(this.onIsoRendererDialog);
    this._$html.find('[name="eam-renderer-dialog-button"]').click(this.onEamRendererDialog);
    this._$html.find('[name="mcs-renderer-dialog-button"]').click(this.onMcsRendererDialog);
    this._$html.find('[name="reinhard-tone-mapper-dialog-button"]').click(this.onReinhardToneMapperDialog);
    this._$html.find('[name="range-tone-mapper-dialog-button"]').click(this.onRangeToneMapperDialog);
};

_.destroy = function() {
    this._$html.remove();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

// ============================ STATIC METHODS ============================= //

})(this);
