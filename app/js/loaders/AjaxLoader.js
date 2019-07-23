//@@../utils/Utils.js
//@@AbstractLoader.js

(function(global) {
'use strict';

var Class = global.AjaxLoader = AjaxLoader;
CommonUtils.inherit(Class, AbstractLoader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function AjaxLoader(url, options) {
    _.sup.constructor.call(this, options);
    CommonUtils.extend(this, Class.defaults, options);

    this.url = url;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readLength = function(handlers) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function(e) {
        var contentLength = e.target.getResponseHeader('Content-Length');
        handlers.onData && handler.onData(parseInt(contentLength));
    });
    xhr.open('HEAD', this.url);
    xhr.responseType = 'arraybuffer';
    xhr.send();
};


_.readData = function(start, end, handlers) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function(e) {
        handlers.onData && handler.onData(e.target.result);
    });
    xhr.open('GET', this.url);
    xhr.setRequestHeader('Range', 'bytes=' + start + '-' + (end - 1));
    xhr.responseType = 'arraybuffer';
    xhr.send();
};

// ============================ STATIC METHODS ============================= //

})(this);
