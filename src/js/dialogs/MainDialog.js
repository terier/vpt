// #part /js/dialogs/MainDialog

// #link ../utils
// #link AbstractDialog

// #link /uispecs/MainDialog
// #link /html/AboutText

class MainDialog extends AbstractDialog {

constructor(options) {
    super(UISPECS.MainDialog, options);

    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);

    this._binds.sidebar.appendTo(document.body);
    this._binds.rendererSelect.addEventListener('change', this._handleRendererChange);
    this._binds.toneMapperSelect.addEventListener('change', this._handleToneMapperChange);

    const about = DOMUtils.instantiate(TEMPLATES.AboutText);
    this._binds.about._element.appendChild(about);
}

getVolumeLoadContainer() {
    return this._binds.volumeLoadContainer;
}

getEnvmapLoadContainer() {
    return this._binds.envmapLoadContainer;
}

getRendererSettingsContainer() {
    return this._binds.rendererSettingsContainer;
}

getToneMapperSettingsContainer() {
    return this._binds.toneMapperSettingsContainer;
}

getRenderingContextSettingsContainer() {
    return this._binds.renderingContextSettingsContainer;
}

getSelectedRenderer() {
    return this._binds.rendererSelect.getValue();
}

getSelectedToneMapper() {
    return this._binds.toneMapperSelect.getValue();
}

_handleRendererChange() {
    this.dispatchEvent(new Event('rendererchange'));
}

_handleToneMapperChange() {
    this.dispatchEvent(new Event('tonemapperchange'));
}

}
