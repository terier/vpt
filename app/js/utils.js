function noop() {
}

function downloadJSON(json, filename) {
    var str = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json));
    var a = document.createElement('a');
    a.setAttribute('href', str);
    a.setAttribute('download', filename);
    a.click();
    a = null;
}

function inherit(sub, sup) {
    sub.prototype = Object.create(sup.prototype);
}

var noimpl = new Error('Not implemented!');
