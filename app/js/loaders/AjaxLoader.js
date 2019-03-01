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

_.getLength = function(callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function(e) {
        var contentLength = e.target.getResponseHeader('Content-Length');
        callback(parseInt(contentLength, 10));
    });
    xhr.addEventListener('abort', function(e) {
        callback(null);
    });
    xhr.addEventListener('error', function(e) {
        callback(null);
    });
    xhr.open('HEAD', this.url);
    xhr.responseType = 'blob';
    xhr.send();
};


_.read = function(start, end, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('load', function(e) {
        callback(e.target.result);
    });
    xhr.addEventListener('abort', function(e) {
        callback(null);
    });
    xhr.addEventListener('error', function(e) {
        callback(null);
    });
    xhr.open('GET', this.url);
    xhr.setRequestHeader('Range', 'bytes=' + start + '-' + (end - 1));
    xhr.responseType = 'blob';
    xhr.send();
};

// ============================ STATIC METHODS ============================= //

})(this);
