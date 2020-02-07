// #package js/main

// #include math
// #include Ticker.js

class OrbitCameraController {

constructor(camera, domElement, options) {
    this._update = this._update.bind(this);
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);
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
    this._domElement.addEventListener('mousedown', this._handleMouseDown);
    this._domElement.addEventListener('touchstart', this._handleMouseDown);
    document.addEventListener('mouseup', this._handleMouseUp);
    document.addEventListener('touchend', this._handleMouseUp);
    document.addEventListener('mousemove', this._handleMouseMove);
    document.addEventListener('touchmove', this._handleMouseMove);
    this._domElement.addEventListener('mousewheel', this._handleMouseWheel);
    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keyup', this._handleKeyUp);
}

_handleMouseDown(e) {
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

_handleMouseUp(e) {
    e.preventDefault();
    this._isTranslating = false;
    this._isRotating = false;
}

_handleMouseMove(e) {
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

_handleMouseWheel(e) {
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
