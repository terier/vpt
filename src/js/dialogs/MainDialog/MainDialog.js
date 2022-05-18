import { DOMUtils } from '../../utils/DOMUtils.js';
import { GroupDialog } from '../GroupDialog/GroupDialog.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./MainDialog.html', import.meta.url))
    .then(response => response.text());

const aboutTemplate = await fetch(new URL('./AboutText.html', import.meta.url))
    .then(response => response.text());

export class MainDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);

    document.body.appendChild(this.binds.sidebar);
    this.binds.rendererSelect.addEventListener('change', this._handleRendererChange);
    this.binds.toneMapperSelect.addEventListener('change', this._handleToneMapperChange);

    const about = DOMUtils.instantiate(aboutTemplate);
    this.binds.about.appendChild(about);

    const groupDialog = new GroupDialog();
    this.binds.groups.appendChild(groupDialog.object);
}

getVolumeLoadContainer() {
    return this.binds.volumeLoadContainer;
}

getEnvmapLoadContainer() {
    return this.binds.envmapLoadContainer;
}

getRendererSettingsContainer() {
    return this.binds.rendererSettingsContainer;
}

getToneMapperSettingsContainer() {
    return this.binds.toneMapperSettingsContainer;
}

getRenderingContextSettingsContainer() {
    return this.binds.renderingContextSettingsContainer;
}

getSelectedRenderer() {
    return this.binds.rendererSelect.value;
}

getSelectedToneMapper() {
    return this.binds.toneMapperSelect.value;
}

_handleRendererChange() {
    this.dispatchEvent(new Event('rendererchange'));
}

_handleToneMapperChange() {
    this.dispatchEvent(new Event('tonemapperchange'));
}

}
