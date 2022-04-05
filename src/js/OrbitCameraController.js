import { Vector } from './math/Vector.js';
import { Quaternion } from './math/Quaternion.js';
import { Ticker } from './Ticker.js';

export class OrbitCameraController {

constructor(camera, domElement, options) {
    this._update = this._update.bind(this);
    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handleWheel = this._handleWheel.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);

    Object.assign(this, {
        rotationSpeed    : 2,
        translationSpeed : 2,
        moveSpeed        : 0.001,
        zoomSpeed        : 0.001
    }, options);

    this._camera = camera;
    this._domElement = domElement;

    this._focus = this._camera.position.len();

    this._forward = false;
    this._backward = false;
    this._left = false;
    this._right = false;

    this._isTranslating = false;
    this._isRotating = false;

    this._time = Date.now();

    this._addEventListeners();
    Ticker.add(this._update);
}

_addEventListeners() {
    this._domElement.addEventListener('pointerdown', this._handlePointerDown);
    document.addEventListener('pointerup', this._handlePointerUp);
    document.addEventListener('pointermove', this._handlePointerMove);
    this._domElement.addEventListener('wheel', this._handleWheel);
    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keyup', this._handleKeyUp);
}

_handlePointerDown(e) {
    e.preventDefault();
    if (typeof e.touches === 'object') {
        this._startX = e.touches[0].pageX;
        this._startY = e.touches[0].pageY;
        this._isRotating = true;
    } else if (e.button === 0) {
        this._startX = e.pageX;
        this._startY = e.pageY;
        this._isRotating = true;
    } else if (e.button === 1) {
        this._startX = e.pageX;
        this._startY = e.pageY;
        this._isTranslating = true;
    }
}

_handlePointerUp(e) {
    e.preventDefault();
    this._isTranslating = false;
    this._isRotating = false;
}

_handlePointerMove(e) {
    e.preventDefault();

    const x = typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX;
    const y = typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY;
    const dx = x - this._startX;
    const dy = y - this._startY;

    if (this._isRotating) {
        const angleX = dx * this.rotationSpeed * this._focus * this._camera.zoomFactor;
        const angleY = dy * this.rotationSpeed * this._focus * this._camera.zoomFactor;

        if (e.shiftKey) {
            this._rotateAroundSelf(angleX, angleY);
        } else {
            this._rotateAroundFocus(angleX, angleY);
        }
    }

    if (this._isTranslating) {
        const speedFactor = this.translationSpeed * this._focus * this._camera.zoomFactor;
        this._move(-dx * speedFactor, dy * speedFactor, 0);
    }

    this._startX = x;
    this._startY = y;
}

_handleWheel(e) {
    e.preventDefault();
    const amount = e.deltaY * this.zoomSpeed;
    const keepScale = e.shiftKey;
    this._zoom(amount, keepScale);
}

_handleKeyDown(e) {
    switch (e.key.toLowerCase()) {
        case 'w': this._forward  = true; break;
        case 'a': this._left     = true; break;
        case 's': this._backward = true; break;
        case 'd': this._right    = true; break;
    }
}

_handleKeyUp(e) {
    switch (e.key.toLowerCase()) {
        case 'w': this._forward  = false; break;
        case 'a': this._left     = false; break;
        case 's': this._backward = false; break;
        case 'd': this._right    = false; break;
    }
}

_rotateAroundFocus(dx, dy) {
    const angle = Math.sqrt(dx * dx + dy * dy);
    const rotation = new Quaternion(dy / angle, dx / angle, 0, angle);
    rotation.fromAxisAngle();

    // get focus point
    // TODO: refactor this and positioning
    const cp = this._camera.position.clone();
    const cr = this._camera.rotation.clone();
    const f = new Quaternion(0, 0, -this._focus, 0);
    f.multiply(f, cr);
    f.multiply(cr.inverse(), f);

    // rotate camera around self
    this._camera.rotation.multiply(rotation, this._camera.rotation);
    this._camera.rotation.normalize();

    // position camera around focus
    // TODO: find out how this works
    const positionQuat = new Quaternion(0, 0, this._focus, 0);
    positionQuat.multiply(positionQuat, this._camera.rotation);
    positionQuat.multiply(this._camera.rotation.clone().inverse(), positionQuat);
    this._camera.position.set(positionQuat.x, positionQuat.y, positionQuat.z, 1);
    this._camera.position.add(new Vector(cp.x + f.x, cp.y + f.y, cp.z + f.z, 0));

    this._camera.isDirty = true;
}

_rotateAroundSelf(dx, dy) {
    const angle = Math.sqrt(dx * dx + dy * dy);
    const rotation = new Quaternion(dy / angle, dx / angle, 0, angle);
    rotation.fromAxisAngle();

    this._camera.rotation.multiply(rotation, this._camera.rotation);
    this._camera.rotation.normalize();

    this._camera.isDirty = true;
}

_move(dx, dy, dz) {
    const v = new Quaternion(dx, dy, dz, 0);
    const r = this._camera.rotation.clone();
    v.multiply(v, r);
    v.multiply(r.inverse(), v);
    this._camera.position.add(v);
    this._camera.isDirty = true;
}

_zoom(amount, keepScale) {
    this._camera.zoom(amount);
    if (keepScale) {
        const scale = Math.exp(-amount);
        this._camera.position.mul(new Vector(scale, scale, scale, 1));
        this._focus *= scale;
    }
    this._camera.isDirty = true;
}

_update() {
    const t = Date.now();
    const dt = t - this._time;
    this._time = t;

    let dx = 0;
    let dz = 0;

    if (this._forward) {
        dz -= this.moveSpeed * this._focus * dt;
    }
    if (this._backward) {
        dz += this.moveSpeed * this._focus * dt;
    }
    if (this._left) {
        dx -= this.moveSpeed * this._focus * dt;
    }
    if (this._right) {
        dx += this.moveSpeed * this._focus * dt;
    }

    if (dx !== 0 || dz !== 0) {
        this._move(dx, 0, dz);
    }
}

}
