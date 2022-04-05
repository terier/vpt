export class DOMUtils {

static template(tmpl) {
    let div = document.createElement('div');
    div.innerHTML = tmpl;
    const element = div.querySelector('.instantiate');
    div.removeChild(element);
    return element;
}

static instantiate(tmpl) {
    if (typeof tmpl === 'string') {
        return DOMUtils.template(tmpl);
    } else {
        return tmpl.cloneNode(true);
    }
}

static bind(element) {
    const binds = {};
    const elements = element.querySelectorAll('[data-bind]');
    for (const element of elements) {
        binds[element.dataset.bind] = element;
    }
    return binds;
}

static show(element) {
    element.classList.remove('invisible');
}

static hide(element) {
    element.classList.add('invisible');
}

static toggle(element) {
    element.classList.toggle('invisible');
}

}
