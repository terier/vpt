function noop() {
}

function inherit(sub, sup) {
    $.extend(sub.prototype, sup.prototype, {
        sup: sup.prototype
    });
}

var noimpl = new Error('Not implemented!');
