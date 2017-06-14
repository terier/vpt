var Vector = (function() {
'use strict';

function Vector(x, y, z, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = (w !== undefined) ? w : 1;
}

var _ = Vector.prototype;

_.clone = function() {
    return new Vector(this.x, this.y, this.z, this.w);
};

_.copy = function(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w;
    return this;
};

_.set = function(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
};

_.add = function(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    this.w = a.w + b.w;

    return this;
};

_.sub = function(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    this.w = a.w - b.w;

    return this;
};

_.mul = function(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;
    this.w = a.w * b.w;

    return this;
};

_.dot = function(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
};

_.cross = function(a, b) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    this.w = 1;

    return this;
};

return Vector;

})();
