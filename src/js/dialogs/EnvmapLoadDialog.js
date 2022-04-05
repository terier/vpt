import { AbstractDialog } from './AbstractDialog.js';

const spec = await fetch('./uispecs/EnvmapLoadDialog.json').then(response => response.json());

export class EnvmapLoadDialog extends AbstractDialog {

constructor(options) {
    super(spec, options);

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
    this._binds.type.addEventListener('change', this._handleTypeChange);
    this._binds.loadButton.addEventListener('click', this._handleLoadClick);
    this._binds.file.addEventListener('change', this._handleFileChange);
    this._binds.url.addEventListener('input', this._handleURLChange);
    this._binds.demo.addEventListener('change', this._handleDemoChange);
}

async _loadDemoJson() {
    try {
        const response = await fetch('demo-envmaps.json');
        this._demos = await response.json();
        this._demos.forEach(demo => {
            this._binds.demo.addOption(demo.value, demo.label);
        });
    } catch (e) {
        console.warn('demo-envmaps.json not available');
    }
}

_handleLoadClick() {
    switch (this._binds.type.getValue()) {
        case 'file' : this._handleLoadFile(); break;
        case 'url'  : this._handleLoadURL();  break;
        case 'demo' : this._handleLoadDemo(); break;
    }
}

_handleLoadFile() {
    const files = this._binds.file.getFiles();
    if (files.length === 0) {
        // update status bar?
        return;
    }
    const file = files[0];

    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'file',
            file : file,
        }
    }));
}

_handleLoadURL() {
    const url = this._binds.url.getValue();
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'url',
            url  : url,
        }
    }));
}

_handleLoadDemo() {
    const demo = this._binds.demo.getValue();
    const found = this._demos.find(d => d.value === demo);
    this.dispatchEvent(new CustomEvent('load', {
        detail: {
            type : 'url',
            url  : found.url,
        }
    }));
}

_handleTypeChange() {
    // TODO: switching panel
    switch (this._binds.type.getValue()) {
        case 'file':
            this._binds.filePanel.show();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.hide();
            break;
        case 'url':
            this._binds.filePanel.hide();
            this._binds.urlPanel.show();
            this._binds.demoPanel.hide();
            break;
        case 'demo':
            this._binds.filePanel.hide();
            this._binds.urlPanel.hide();
            this._binds.demoPanel.show();
            break;
    }
    this._updateLoadButtonAndProgressVisibility();
}

_handleFileChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleURLChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_handleDemoChange() {
    this._updateLoadButtonAndProgressVisibility();
}

_updateLoadButtonAndProgressVisibility() {
    switch (this._binds.type.getValue()) {
        case 'file':
            const files = this._binds.file.getFiles();
            this._binds.loadButtonAndProgress.setVisible(files.length > 0);
            break;
        case 'url':
            const urlEmpty = this._binds.url.getValue() === '';
            this._binds.loadButtonAndProgress.setVisible(!urlEmpty);
            break;
        case 'demo':
            const demo = this._binds.demo.getValue();
            this._binds.loadButtonAndProgress.setVisible(!!demo);
            break;
    }
}

}
