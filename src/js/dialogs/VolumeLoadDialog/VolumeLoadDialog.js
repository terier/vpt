import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./VolumeLoadDialog.html', import.meta.url))
    .then(response => response.text());

export class VolumeLoadDialog extends EventTarget {

constructor() {
    super();

    this.object = template.content.cloneNode(true);
    this.binds = DOMUtils.bind(this.object);

    this._handleTypeChange = this._handleTypeChange.bind(this);
    this._handleLoadClick = this._handleLoadClick.bind(this);
    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleURLChange = this._handleURLChange.bind(this);
    this._handleDemoChange = this._handleDemoChange.bind(this);

    this._demos = [];

    this._addEventListeners();
    this._loadDemoJson();
}

_addEventListeners() {
    this.binds.type.addEventListener('change', this._handleTypeChange);
    this.binds.loadButton.addEventListener('click', this._handleLoadClick);
    this.binds.file.addEventListener('change', this._handleFileChange);
    this.binds.url.addEventListener('input', this._handleURLChange);
    this.binds.demo.addEventListener('change', this._handleDemoChange);
}

async _loadDemoJson() {
    try {
        const response = await fetch('demo-volumes.json');
        this._demos = await response.json();
        this._demos.forEach(demo => {
            const option = document.createElement('option');
            option.value = demo.value;
            option.textContent = demo.label;
            this.binds.demo.appendChild(option);
        });
    } catch (e) {
        console.warn('demo-volumes.json not available');
    }
}

_getVolumeTypeFromURL(filename) {
    const exn = filename.split('.').pop().toLowerCase();
    const exnToType = {
        'bvp'  : 'bvp',
        'json' : 'json',
        'zip'  : 'zip',
    };
    return exnToType[exn] || 'raw';
}

_handleLoadClick() {
    switch (this.binds.type.value) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
}

_handleLoadFile() {
    const files = this.binds.file.files;
    if (files.length === 0) {
        // update status bar?
        return;
    }

    const file = files[0];
    const filetype = this._getVolumeTypeFromURL(file.name);
    const dimensions = this.binds.dimensions.value;
    const precisionChecked = this.binds.precision.querySelector('input:checked');
    const precision = parseInt(precisionChecked.value, 10);

    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type       : 'file',
            file       : file,
            filetype   : filetype,
            dimensions : dimensions,
            precision  : precision,
        }
    }));
}

_handleLoadURL() {
    const url = this.binds.url.value;
    const filetype = this._getVolumeTypeFromURL(url);
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type     : 'url',
            url      : url,
            filetype : filetype,
        }
    }));
}

_handleLoadDemo() {
    const demo = this.binds.demo.value;
    const found = this._demos.find(d => d.value === demo);
    const filetype = this._getVolumeTypeFromURL(found.url);
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type     : 'url',
            url      : found.url,
            filetype : filetype,
        }
    }));
}

_handleTypeChange() {
    // TODO: switching panel
    switch (this.binds.type.value) {
        case 'file':
            DOMUtils.show(this.binds.filePanel);
            DOMUtils.hide(this.binds.urlPanel);
            DOMUtils.hide(this.binds.demoPanel);
            break;
        case 'url':
            DOMUtils.hide(this.binds.filePanel);
            DOMUtils.show(this.binds.urlPanel);
            DOMUtils.hide(this.binds.demoPanel);
            break;
        case 'demo':
            DOMUtils.hide(this.binds.filePanel);
            DOMUtils.hide(this.binds.urlPanel);
            DOMUtils.show(this.binds.demoPanel);
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFileChange() {
    const files = this.binds.file.files;
    if (files.length === 0) {
        DOMUtils.hide(this.binds.rawSettingsPanel);
    } else {
        const file = files[0];
        const type = this._getVolumeTypeFromURL(file.name);
        DOMUtils.toggle(this.binds.rawSettingsPanel, type === 'raw');
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleURLChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleDemoChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_updateLoadButtonAndProgressVisibility() {
    switch (this.binds.type.value) {
        case 'file':
            const files = this.binds.file.files;
            DOMUtils.toggle(this.binds.loadButtonAndProgress, files.length !== 0);
            break;
        case 'url':
            const urlEmpty = this.binds.url.value === '';
            DOMUtils.toggle(this.binds.loadButtonAndProgress, !urlEmpty);
            break;
        case 'demo':
            const demo = this.binds.demo.value;
            DOMUtils.toggle(this.binds.loadButtonAndProgress, !!demo);
            break;
    }
}

}
