// #part /js/dialogs/tonemappers/LottesToneMapperDialog

// #link ../AbstractDialog

// #link /uispecs/tonemappers/LottesToneMapperDialog

class LottesToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.tonemappers.LottesToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.exposure.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._toneMapper.exposure = this._binds.exposure.getValue();
}

}
