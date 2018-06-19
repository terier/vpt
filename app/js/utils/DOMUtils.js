var DOMUtils = (function() {

function fromString(tmpl) {
    var templateElement = document.createElement('template');
    templateElement.innerHTML = tmpl;
    return templateElement.content;
}

function template(tmpl) {
    return document.importNode(tmpl.content, true);
}

function bind(element) {
    var elements = element.querySelectorAll('[data-bind]');
    return Array.prototype.reduce.call(elements, function(map, obj) {
        map[obj.getAttribute('data-bind')] = obj;
        return map;
    }, {});
}

return {
    fromString : fromString,
    template   : template,
    bind       : bind
};

})();
