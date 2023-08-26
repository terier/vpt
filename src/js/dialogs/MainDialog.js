import { AbstractDialog } from './AbstractDialog.js';
import { DOMUtils } from '../utils/DOMUtils.js';

const [aboutTemplate, spec] = await Promise.all([
    fetch('./html/AboutText.html').then(response => response.text()),
    fetch('./uispecs/MainDialog.json').then(response => response.json()),
]);

export class MainDialog extends AbstractDialog {

constructor(options) {
    super(spec, options);

    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleGetMVP = this._handleGetMVP.bind(this);
    this._handleSetMVP = this._handleSetMVP.bind(this);
    this._handleStartIterationTesting = this._handleStartIterationTesting.bind(this);

    this._binds.sidebar.appendTo(document.body);
    this._binds.rendererSelect.addEventListener('change', this._handleRendererChange);
    this._binds.toneMapperSelect.addEventListener('change', this._handleToneMapperChange);

    this._binds.getMVP.addEventListener('click', this._handleGetMVP);
    this._binds.setMVP.addEventListener('change', this._handleSetMVP);
    this._binds.startIterationTesting.addEventListener('click', this._handleStartIterationTesting);

    const about = DOMUtils.instantiate(aboutTemplate);
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

// Testing

_handleGetMVP() {
    this.dispatchEvent(new Event('getMVP'));
}
getSetMVP() {
    return this._binds.setMVP.getValue();
}

_handleSetMVP() {
    this.dispatchEvent(new Event('setMVP'));
}

getIterationTestingProperties() {
    return {
        "iterations": this._binds.totalIterations.getValue(),
        "intervals": this._binds.intervals.getValue(),
        "saveAs": this._binds.saveAs.getValue(),
    }
}

_handleStartIterationTesting() {
    this.dispatchEvent(new Event('startIterationTesting'));
}

}
