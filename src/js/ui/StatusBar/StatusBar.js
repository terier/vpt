import { DOMUtils } from '../../utils/DOMUtils.js';

const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./StatusBar.html', import.meta.url))
    .then(response => response.text());

const templateLog = await fetch(new URL('./StatusBarLog.html', import.meta.url))
    .then(response => response.text());

export class StatusBar extends HTMLElement {

constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);
}

_log(text, level) {
    const newLog = DOMUtils.instantiate(templateLog);
    const binds = DOMUtils.bind(newLog);
    binds.timestamp.textContent = new Date().toISOString();
    binds.content.textContent = text;
    if (level) {
        newLog.classList.add(level);
    }
    this.shadow.appendChild(newLog);
    this.scrollTop = this.scrollHeight;
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

customElements.define('ui-status-bar', StatusBar);
