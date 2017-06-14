var Util = (function() {
'use strict';

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
    sub.prototype.constructor = sub;
    sub.prototype.sup = sup.prototype;
}

var noimpl = new Error('Not implemented!');

return {
    noop: noop,
    downloadJSON: downloadJSON,
    inherit: inherit,
    noimpl: noimpl
};

})();
