// #part /js/dialogs/tonemappers/ReinhardToneMapperDialog

// #link ../AbstractDialog

// #link /uispecs/tonemappers/ReinhardToneMapperDialog

class ReinhardToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.tonemappers.ReinhardToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.exposure.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._toneMapper._exposure = this._binds.exposure.getValue();
}

}
