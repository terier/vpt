// #package js/main

class DOMUtils {

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
    const elements = element.querySelectorAll('[data-bind]');
    return Array.prototype.reduce.call(elements, function(map, obj) {
        map[obj.getAttribute('data-bind')] = obj;
        return map;
    }, {});
}

static remove(element) {
    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

static data(element, key, value) {
    if (typeof value !== 'undefined') {
        element.setAttribute('data-' + key, value);
    } else {
        return element.getAttribute('data-' + key);
    }
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
