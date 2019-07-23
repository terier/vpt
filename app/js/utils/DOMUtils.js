var DOMUtils = (function() {

function template(tmpl) {
    var div = document.createElement('div');
    div.innerHTML = tmpl;
    var child = div.firstChild;
    div.removeChild(child);
    return child;
}

function instantiate(tmpl) {
    if (typeof tmpl === 'string') {
        return template(tmpl);
    } else {
        return tmpl.cloneNode(true);
    }
}

function bind(element) {
    var elements = element.querySelectorAll('[data-bind]');
    return Array.prototype.reduce.call(elements, function(map, obj) {
        map[obj.getAttribute('data-bind')] = obj;
        return map;
    }, {});
}

function remove(element) {
    if (element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function data(element, key, value) {
    if (typeof value !== 'undefined') {
        element.setAttribute('data-' + key, value);
    } else {
        return element.getAttribute('data-' + key);
    }
}

function show(element) {
    element.classList.remove('invisible');
}

function hide(element) {
    element.classList.add('invisible');
}

function toggle(element) {
    element.classList.toggle('invisible');
}

return {
    template    : template,
    instantiate : instantiate,
    bind        : bind,
    remove      : remove,
    data        : data,
    show        : show,
    hide        : hide,
    toggle      : toggle
};

})();
