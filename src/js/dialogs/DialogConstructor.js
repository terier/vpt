import { DOMUtils } from '../utils/DOMUtils.js';

export class DialogConstructor {

static construct(properties) {
    const panel = document.createElement('div');
    for (const property of properties) {
        const widget = this.constructProperty(property);
        if (property.type === 'transfer-function') {
            const accordion = `<ui-accordion><span slot="label">Transfer function</span>${widget}</ui-accordion>`;
            const instance = DOMUtils.instantiate(accordion);
            panel.appendChild(instance);
        } else {
            const field = `<ui-field><label slot="label">${property.label}</label>${widget}</ui-field>`;
            const instance = DOMUtils.instantiate(field);
            panel.appendChild(instance);
        }
    }
    return panel;
}

// TODO: This is ugly. Fix ASAP.
static constructProperty(property) {
    switch (property.type) {
        case 'spinner': return `<input type="number" bind="${property.name}" value="${property.value}" min="${property.min}" max="${property.max}" step="${property.step}">`;
        case 'vector-spinner': return `<ui-vector-spinner bind="${property.name}" value="${JSON.stringify(property.value)}" min="${property.min}" max="${property.max}" step="${property.step}"></ui-slider>`;
        case 'slider': return `<ui-slider bind="${property.name}" value="${property.value}" min="${property.min}" max="${property.max}" step="${property.step}"></ui-slider>`;
        case 'checkbox': return `<ui-checkbox bind="${property.name}" ${property.value ? "checked" : ""}></ui-checkbox>`;
        case 'color-chooser': return `<ui-color-chooser bind="${property.name}" value="${property.value}"></ui-color-chooser>`;
        case 'transfer-function': return `<ui-transfer-function bind="${property.name}"></ui-transfer-function>`;
        default: return `<div></div>`;
    }
}

}
