//@@utils/Utils.js

(function(global) {
'use strict';

var Class = global.Draggable = Draggable;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Draggable(element, handle, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._element = element;
    this._handle = handle;

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._startX = 0;
    this._startY = 0;

    this._handle.addEventListener('mousedown', this._handleMouseDown);
};

_.destroy = function() {
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseup', this._handleMouseUp);
    this._handle.removeEventListener('mousedown', this._handleMouseDown);

    this._element = null;
    this._handle = null;

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleMouseDown = function(e) {
    this._startX = e.pageX;
    this._startY = e.pageY;

    document.addEventListener('mousemove', this._handleMouseMove);
    document.addEventListener('mouseup', this._handleMouseUp);
    this._handle.removeEventListener('mousedown', this._handleMouseDown);

    var event = new CustomEvent('draggablestart', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
};

_._handleMouseUp = function(e) {
    document.removeEventListener('mousemove', this._handleMouseMove);
    document.removeEventListener('mouseup', this._handleMouseUp);
    this._handle.addEventListener('mousedown', this._handleMouseDown);

    var event = new CustomEvent('draggableend', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
};

_._handleMouseMove = function(e) {
    var dx = e.pageX - this._startX;
    var dy = e.pageY - this._startY;
    var x = this._element.offsetLeft;
    var y = this._element.offsetTop;
    this._element.style.left = (x + dx) + 'px';
    this._element.style.top = (y + dy) + 'px';
    this._startX = e.pageX;
    this._startY = e.pageY;

    var event = new CustomEvent('draggable', {
        detail: {
            x: this._startX,
            y: this._startY
        }
    });
    this._element.dispatchEvent(event);
};

// ============================ STATIC METHODS ============================= //

})(this);
