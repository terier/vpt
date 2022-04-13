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
            this.binds.demo.addOption(demo.value, demo.label);
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
    switch (this.binds.type.getValue()) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
}

_handleLoadFile() {
    const files = this.binds.file.getFiles();
    if (files.length === 0) {
        // update status bar?
        return;
    }

    const file = files[0];
    const filetype = this._getVolumeTypeFromURL(file.name);
    const dimensions = this.binds.dimensions.getValue();
    const precision = parseInt(this.binds.precision.getValue(), 10);

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
    const url = this.binds.url.getValue();
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
    const demo = this.binds.demo.getValue();
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
    switch (this.binds.type.getValue()) {
        case 'file':
            this.binds.filePanel.setVisible(true);
            this.binds.urlPanel.setVisible(false);
            this.binds.demoPanel.setVisible(false);
            break;
        case 'url':
            this.binds.filePanel.setVisible(false);
            this.binds.urlPanel.setVisible(true);
            this.binds.demoPanel.setVisible(false);
            break;
        case 'demo':
            this.binds.filePanel.setVisible(false);
            this.binds.urlPanel.setVisible(false);
            this.binds.demoPanel.setVisible(true);
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFileChange() {
    const files = this.binds.file.getFiles();
    if (files.length === 0) {
        this.binds.rawSettingsPanel.setVisible(false);
    } else {
        const file = files[0];
        const type = this._getVolumeTypeFromURL(file.name);
        this.binds.rawSettingsPanel.setVisible(type === 'raw');
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
    switch (this.binds.type.getValue()) {
        case 'file':
            const files = this.binds.file.getFiles();
            this.binds.loadButtonAndProgress.setVisible(files.length > 0);
            break;
        case 'url':
            const urlEmpty = this.binds.url.getValue() === '';
            this.binds.loadButtonAndProgress.setVisible(!urlEmpty);
            break;
        case 'demo':
            const demo = this.binds.demo.getValue();
            this.binds.loadButtonAndProgress.setVisible(!!demo);
            break;
    }
}

}
