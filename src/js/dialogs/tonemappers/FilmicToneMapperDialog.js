// #part /js/dialogs/tonemappers/FilmicToneMapperDialog

// #link ../AbstractDialog

// #link /uispecs/tonemappers/FilmicToneMapperDialog

class FilmicToneMapperDialog extends AbstractDialog {

constructor(toneMapper, options) {
    super(UISPECS.tonemappers.FilmicToneMapperDialog, options);

    this._toneMapper = toneMapper;

    this._handleChange = this._handleChange.bind(this);

    this._binds.exposure.addEventListener('input', this._handleChange);
}

_handleChange() {
    this._toneMapper.exposure = this._binds.exposure.getValue();
}

}
