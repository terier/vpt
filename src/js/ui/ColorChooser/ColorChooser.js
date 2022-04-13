const template = document.createElement('template');
template.innerHTML = await fetch(new URL('./ColorChooser.html', import.meta.url))
    .then(response => response.text());

export class ColorChooser extends HTMLElement {

constructor(options) {
    super();

    this.inputListener = this.inputListener.bind(this);
    this.clickListener = this.clickListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    this.binds.color.style.backgroundColor = this.binds.input.value /* + alpha */;
    this.binds.input.addEventListener('input', this.inputListener);
    this.addEventListener('click', this.clickListener);
}

get value() {
    return this.binds.input.value;
}

set value(value) {
    this.binds.input.value = value;
    this.binds.color.style.backgroundColor = this.binds.input.value /* + alpha */;
}

clickListener(e) {
    this.binds.input.click();
}

}

customElements.define('ui-color-chooser', ColorChooser);
