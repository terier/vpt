// #package js/main

// #include ../utils
// #include UIObject.js

class ProgressBar extends UIObject {

constructor(options) {
    super(TEMPLATES.ProgressBar, options);

    Object.assign(this, {
        progress: 0
    }, options);

    this.setProgress(this.progress);
}

setProgress(progress) {
    this.progress = Math.round(CommonUtils.clamp(progress, 0, 100));
    this._binds.progress.style.width = this.progress + '%';
    this._binds.label.textContent = this.progress + '%';
}

getProgress() {
    return this.progress;
}

}
