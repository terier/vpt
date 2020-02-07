// #package js/main

class Vector {

constructor(x, y, z, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = (w !== undefined) ? w : 1;
}

clone() {
    return new Vector(this.x, this.y, this.z, this.w);
}

copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w;
    return this;
}

set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
}

add(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    this.w = a.w + b.w;

    return this;
}

sub(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    this.w = a.w - b.w;

    return this;
}

mul(a, b) {
    if (!b) {
        b = this;
    }

    this.x = a.x * b.x;
    this.y = a.y * b.y;
    this.z = a.z * b.z;
    this.w = a.w * b.w;

    return this;
}

normalize() {
    const len = this.len();

    this.x /= len;
    this.y /= len;
    this.z /= len;

    return this;
}

setLength(len) {
    this.normalize();

    this.x *= len;
    this.y *= len;
    this.z *= len;

    return this;
}

dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
}

cross(a, b) {
    const ax = a.x, ay = a.y, az = a.z;
    const bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    this.w = 1;

    return this;
}

lensq() {
    return this.dot(this);
}

len() {
    return Math.sqrt(this.lensq());
}

}
