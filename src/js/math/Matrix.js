// #package js/main

// #include Quaternion.js

class Matrix {

constructor(data) {
    this.m = new Float32Array(16);
    if (data) {
        this.m.set(data);
    } else {
        this.identity();
    }
}

clone() {
    return new Matrix(this.m);
}

copy(m) {
    this.m.set(m.m);
    return this;
}

identity() {
    this.m.fill(0);
    this.m[0] = this.m[5] = this.m[10] = this.m[15] = 1;
}

transpose() {
    let T;
    let m = this.m;

    T = m[ 1]; m[ 1] = m[ 4]; m[ 4] = T;
    T = m[ 2]; m[ 2] = m[ 8]; m[ 8] = T;
    T = m[ 6]; m[ 6] = m[ 9]; m[ 9] = T;
    T = m[ 3]; m[ 3] = m[12]; m[12] = T;
    T = m[ 7]; m[ 7] = m[13]; m[13] = T;
    T = m[11]; m[11] = m[14]; m[14] = T;

    return this;
}

multiply(a, b) {
    const am = a.m;
    const bm = b.m;
    let m = this.m;

    const a11 = am[ 0], a12 = am[ 1], a13 = am[ 2], a14 = am[ 3];
    const a21 = am[ 4], a22 = am[ 5], a23 = am[ 6], a24 = am[ 7];
    const a31 = am[ 8], a32 = am[ 9], a33 = am[10], a34 = am[11];
    const a41 = am[12], a42 = am[13], a43 = am[14], a44 = am[15];

    const b11 = bm[ 0], b12 = bm[ 1], b13 = bm[ 2], b14 = bm[ 3];
    const b21 = bm[ 4], b22 = bm[ 5], b23 = bm[ 6], b24 = bm[ 7];
    const b31 = bm[ 8], b32 = bm[ 9], b33 = bm[10], b34 = bm[11];
    const b41 = bm[12], b42 = bm[13], b43 = bm[14], b44 = bm[15];

    m[ 0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    m[ 1] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    m[ 2] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    m[ 3] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    m[ 4] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    m[ 5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    m[ 6] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    m[ 7] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    m[ 8] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    m[ 9] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    m[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    m[11] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    m[12] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    m[13] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    m[14] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    m[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return this;
}

det() {
    let m = this.m;

    const m11 = m[ 0], m12 = m[ 1], m13 = m[ 2], m14 = m[ 3];
    const m21 = m[ 4], m22 = m[ 5], m23 = m[ 6], m24 = m[ 7];
    const m31 = m[ 8], m32 = m[ 9], m33 = m[10], m34 = m[11];
    const m41 = m[12], m42 = m[13], m43 = m[14], m44 = m[15];

    return (
        + m11 * m22 * m33 * m44 + m11 * m23 * m34 * m42 + m11 * m24 * m32 * m43
        + m12 * m21 * m34 * m43 + m12 * m23 * m31 * m44 + m12 * m24 * m33 * m41
        + m13 * m21 * m32 * m44 + m13 * m22 * m34 * m41 + m13 * m24 * m31 * m42
        + m14 * m21 * m33 * m42 + m14 * m22 * m31 * m43 + m14 * m23 * m32 * m41
        - m11 * m22 * m34 * m43 - m11 * m23 * m32 * m44 - m11 * m24 * m33 * m42
        - m12 * m21 * m33 * m44 - m12 * m23 * m34 * m41 - m12 * m24 * m31 * m43
        - m13 * m21 * m34 * m42 - m13 * m22 * m31 * m44 - m13 * m24 * m32 * m41
        - m14 * m21 * m32 * m43 - m14 * m22 * m33 * m41 - m14 * m23 * m31 * m42
    );
}

inverse() {
    let m = this.m;
    const detInv = 1 / this.det();

    const m11 = m[ 0], m12 = m[ 1], m13 = m[ 2], m14 = m[ 3];
    const m21 = m[ 4], m22 = m[ 5], m23 = m[ 6], m24 = m[ 7];
    const m31 = m[ 8], m32 = m[ 9], m33 = m[10], m34 = m[11];
    const m41 = m[12], m42 = m[13], m43 = m[14], m44 = m[15];

    m[ 0] = (m22 * m33 * m44 + m23 * m34 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 - m24 * m33 * m42) * detInv;
    m[ 1] = (m12 * m34 * m43 + m13 * m32 * m44 + m14 * m33 * m42 - m12 * m33 * m44 - m13 * m34 * m42 - m14 * m32 * m43) * detInv;
    m[ 2] = (m12 * m23 * m44 + m13 * m24 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 - m14 * m23 * m42) * detInv;
    m[ 3] = (m12 * m24 * m33 + m13 * m22 * m34 + m14 * m23 * m32 - m12 * m23 * m34 - m13 * m24 * m32 - m14 * m22 * m33) * detInv;

    m[ 4] = (m21 * m34 * m43 + m23 * m31 * m44 + m24 * m33 * m41 - m21 * m33 * m44 - m23 * m34 * m41 - m24 * m31 * m43) * detInv;
    m[ 5] = (m11 * m33 * m44 + m13 * m34 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 - m14 * m33 * m41) * detInv;
    m[ 6] = (m11 * m24 * m43 + m13 * m21 * m44 + m14 * m23 * m41 - m11 * m23 * m44 - m13 * m24 * m41 - m14 * m21 * m43) * detInv;
    m[ 7] = (m11 * m23 * m34 + m13 * m24 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 - m14 * m23 * m31) * detInv;

    m[ 8] = (m21 * m32 * m44 + m22 * m34 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 - m24 * m32 * m41) * detInv;
    m[ 9] = (m11 * m34 * m42 + m12 * m31 * m44 + m14 * m32 * m41 - m11 * m32 * m44 - m12 * m34 * m41 - m14 * m31 * m42) * detInv;
    m[10] = (m11 * m22 * m44 + m12 * m24 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 - m14 * m22 * m41) * detInv;
    m[11] = (m11 * m24 * m32 + m12 * m21 * m34 + m14 * m22 * m31 - m11 * m22 * m34 - m12 * m24 * m31 - m14 * m21 * m32) * detInv;

    m[12] = (m21 * m33 * m42 + m22 * m31 * m43 + m23 * m32 * m41 - m21 * m32 * m43 - m22 * m33 * m41 - m23 * m31 * m42) * detInv;
    m[13] = (m11 * m32 * m43 + m12 * m33 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 - m13 * m32 * m41) * detInv;
    m[14] = (m11 * m23 * m42 + m12 * m21 * m43 + m13 * m22 * m41 - m11 * m22 * m43 - m12 * m23 * m41 - m13 * m21 * m42) * detInv;
    m[15] = (m11 * m22 * m33 + m12 * m23 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 - m13 * m22 * m31) * detInv;

    return this;
}

transform(v) {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const w = v.w;

    let m = this.m;
    const m11 = m[ 0], m12 = m[ 1], m13 = m[ 2], m14 = m[ 3];
    const m21 = m[ 4], m22 = m[ 5], m23 = m[ 6], m24 = m[ 7];
    const m31 = m[ 8], m32 = m[ 9], m33 = m[10], m34 = m[11];
    const m41 = m[12], m42 = m[13], m43 = m[14], m44 = m[15];

    v.x = m11 * x + m12 * y + m13 * z + m14 * w;
    v.y = m21 * x + m22 * y + m23 * z + m24 * w;
    v.z = m31 * x + m32 * y + m33 * z + m34 * w;
    v.w = m41 * x + m42 * y + m43 * z + m44 * w;
}

print() {
    let m = this.m;
    console.log(
        '[ ' + m[ 0] + ', ' + m[ 1] + ', ' + m[ 2] + ', ' + m[ 3] + ' ]\n' +
        '[ ' + m[ 4] + ', ' + m[ 5] + ', ' + m[ 6] + ', ' + m[ 7] + ' ]\n' +
        '[ ' + m[ 8] + ', ' + m[ 9] + ', ' + m[10] + ', ' + m[11] + ' ]\n' +
        '[ ' + m[12] + ', ' + m[13] + ', ' + m[14] + ', ' + m[15] + ' ]\n'
    );
}

fromFrustum(left, right, bottom, top, near, far) {
    let m = this.m;

    m[ 0] = 2 * near / (right - left);
    m[ 5] = 2 * near / (top - bottom);

    m[ 2] = (right + left) / (right - left);
    m[ 6] = (top + bottom) / (top - bottom);
    m[10] = -(far + near) / (far - near);

    m[11] = -2 * far * near / (far - near);
    m[14] = -1;

    m[1] = m[3] = m[4] = m[7] = m[8] = m[9] = m[12] = m[13] = m[15] = 0;

    return this;
}

fromTranslation(x, y, z) {
    this.identity();

    let m = this.m;
    m[ 3] = x;
    m[ 7] = y;
    m[11] = z;

    return this;
}

fromRotationX(angle) {
    this.identity();

    const s = Math.sin(angle);
    const c = Math.cos(angle);

    let m = this.m;
    m[ 5] = c;
    m[ 6] = s;
    m[ 9] = -s;
    m[10] = c;

    return this;
}

fromRotationY(angle) {
    this.identity();

    const s = Math.sin(angle);
    const c = Math.cos(angle);

    let m = this.m;
    m[ 0] = c;
    m[ 2] = -s;
    m[ 8] = s;
    m[10] = c;

    return this;
}

fromRotationZ(angle) {
    this.identity();

    const s = Math.sin(angle);
    const c = Math.cos(angle);

    let m = this.m;
    m[ 0] = c;
    m[ 1] = s;
    m[ 4] = -s;
    m[ 5] = c;

    return this;
}

fromScale(x, y, z) {
    this.identity();

    let m = this.m;
    m[ 0] = x;
    m[ 5] = y;
    m[10] = z;

    return this;
}

fromAxisAngle(x, y, z, w) {
    new Quaternion(x, y, z, w).fromAxisAngle().toRotationMatrix(this.m);
    return this;
}

}
