import { UIObject } from './UIObject.js';
import { DOMUtils } from '../utils/DOMUtils.js';

const [template, templateLog] = await Promise.all([
    fetch('./html/ui/StatusBar.html'),
    fetch('./html/ui/StatusBarLog.html'),
].map(promise => promise.then(response => response.text())));

export class StatusBar extends UIObject {

constructor(options) {
    super(template, options);
}

_log(text, level) {
    const newLog = DOMUtils.instantiate(templateLog);
    const binds = DOMUtils.bind(newLog);
    binds.timestamp.textContent = new Date().toISOString();
    binds.content.textContent = text;
    if (level) {
        newLog.classList.add(level);
    }
    this._element.appendChild(newLog);
    this._element.scrollTop = this._element.scrollHeight;
}

log(text) {
    this._log(text);
}

info(text) {
    this._log(text, 'info');
}

warning(text) {
    this._log(text, 'warning');
}

error(text) {
    this._log(text, 'error');
}

}
