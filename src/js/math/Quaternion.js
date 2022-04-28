export class Quaternion {

constructor(x, y, z, w) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = (w !== undefined) ? w : 1;
}

clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
}

copy(q) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
}

set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
}

identity() {
    this.x = this.y = this.z = 0;
    this.w = 1;
    return this;
}

inverse() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
}

multiply(a, b) {
    const ax = a.x, ay = a.y, az = a.z, aw = a.w;
    const bx = b.x, by = b.y, bz = b.z, bw = b.w;

    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;

    return this;
}

length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
}

normalize() {
    const length = this.length();

    this.x /= length;
    this.y /= length;
    this.z /= length;
    this.w /= length;

    return this;
}

fromAxisAngle() {
    const s = Math.sin(this.w / 2);
    const c = Math.cos(this.w / 2);

    this.x *= s;
    this.y *= s;
    this.z *= s;
    this.w = c;

    return this;
}

fromDevice(alpha, beta, gamma) {
    const degtorad = Math.PI / 180;
    const x = beta * degtorad / 2;
    const y = gamma * degtorad / 2;
    const z = alpha * degtorad / 2;

    const cx = Math.cos(x);
    const sx = Math.sin(x);
    const cy = Math.cos(y);
    const sy = Math.sin(y);
    const cz = Math.cos(z);
    const sz = Math.sin(z);

    this.x = sx * cy * cz - cx * sy * sz;
    this.y = cx * sy * cz + sx * cy * sz;
    this.z = cx * cy * sz + sx * sy * cz;
    this.w = cx * cy * cz - sx * sy * sz;

    return this;
}

toRotationMatrix(m) {
    const x = this.x, y = this.y, z = this.z, w = this.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    m[0] = 1 - (yy + zz);
    m[4] = xy - wz;
    m[8] = xz + wy;

    m[1] = xy + wz;
    m[5] = 1 - (xx + zz);
    m[9] = yz - wx;

    m[2] = xz - wy;
    m[6] = yz + wx;
    m[10] = 1 - (xx + yy);

    m[3] = m[7] = m[11] = m[12] = m[13] = m[14] = 0;
    m[15] = 1;
}

}
