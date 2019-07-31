//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Tabs = Tabs;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Tabs(options) {
    _.sup.constructor.call(this, TEMPLATES.Tabs, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._tabs = [];
};

_._init = function() {
    _._nullify.call(this);

    this._index = 0;
};

_.destroy = function() {
    this._tabs.forEach(function(tab) {
        tab.object.detach();
    });

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.add = function(name, object) {
    var panel = document.createElement('div');
    var header = document.createElement('div');
    var index = this._tabs.length;

    header.textContent = name || ('Tab ' + (index + 1));
    this._tabs.push({
        object : object,
        header : header,
        panel  : panel
    });
    this._binds.container.appendChild(panel);
    this._binds.headers.appendChild(header);
    object.appendTo(panel);

    panel.style.order = index;
    header.style.order = index;

    header.classList.add('header');
    header.addEventListener('click', this._handleClick);

    if (this._tabs.length === 1) {
        this.selectTab(0);
    }
};

_._indexOfTab = function(tab) {
    for (var i = 0; i < this._tabs.length; i++) {
        if (this._tabs[i].header === tab ||
            this._tabs[i].panel === tab ||
            this._tabs[i].object === tab)
        {
            return i;
        }
    }
    return -1;
};

_.selectTab = function(objectOrIndex) {
    var len = this._tabs.length;
    if (len === 0) {
        return;
    }

    if (typeof objectOrIndex === 'number') {
        var index = ((objectOrIndex % len) + len) % len;
    } else {
        var index = this._indexOfTab(objectOrIndex);
    }

    if (index >= 0 && index <= len) {
        this._index = index;
        this._updateStyle();
    }
};

_._updateStyle = function() {
    for (var i = 0; i < this._tabs.length; i++) {
        var tab = this._tabs[i];
        var offset = -this._index * 100;
        tab.panel.style.left = offset + '%';
        if (i === this._index) {
            tab.header.classList.add('selected');
            tab.panel.classList.add('selected');
        } else {
            tab.header.classList.remove('selected');
            tab.panel.classList.remove('selected');
        }
    }
};

_._handleClick = function(e) {
    var index = this._indexOfTab(e.target);
    if (index >= 0) {
        this.selectTab(index);
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
