import { quat, vec3, mat4 } from '../../lib/gl-matrix-module.js';
import { Transform } from '../Transform.js';

export class OrbitCameraAnimator extends EventTarget {

constructor(camera, domElement, options = {}) {
    super();

    this._handlePointerDown = this._handlePointerDown.bind(this);
    this._handlePointerUp = this._handlePointerUp.bind(this);
    this._handlePointerMove = this._handlePointerMove.bind(this);
    this._handleWheel = this._handleWheel.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);

    Object.assign(this, {
        rotationSpeed: 0.005,
        translationSpeed: 0.005,
        moveSpeed: 1,
        zoomSpeed: 0.001,
    }, options);

    this._camera = camera;
    this._domElement = domElement;

    this._focus = [0, 0, 0];
    // TODO global transform
    const cameraTransform = this._camera.getComponentOfType(Transform);
    this._focusDistance = vec3.distance(this._focus, cameraTransform.translation);

    this._yaw = 0;
    this._pitch = 0;

    this._forward = false;
    this._backward = false;
    this._left = false;
    this._right = false;

    this._isTranslating = false;
    this._isRotating = false;

    this._isDirty = true;

    this._addEventListeners();
}

_addEventListeners() {
    this._domElement.addEventListener('pointerdown', this._handlePointerDown);
    this._domElement.addEventListener('wheel', this._handleWheel);
    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keyup', this._handleKeyUp);
}

_handlePointerDown(e) {
    this._domElement.setPointerCapture(e.pointerId);
    this._domElement.addEventListener('pointerup', this._handlePointerUp);
    this._domElement.addEventListener('pointermove', this._handlePointerMove);

    if (e.button === 0) {
        this._isRotating = true;
    } else if (e.button === 1) {
        this._isTranslating = true;
    }
}

_handlePointerUp(e) {
    this._domElement.releasePointerCapture(e.pointerId);
    this._domElement.removeEventListener('pointerup', this._handlePointerUp);
    this._domElement.removeEventListener('pointermove', this._handlePointerMove);

    this._isTranslating = false;
    this._isRotating = false;
}

_handlePointerMove(e) {
    const dx = e.movementX;
    const dy = e.movementY;

    if (dx !== 0 || dy !== 0) {
        this._isDirty = true;
    }

    if (this._isRotating) {
        const angleX = -dx * this.rotationSpeed;
        const angleY = -dy * this.rotationSpeed;

        if (e.shiftKey) {
            // TODO: add rotateAroundSelf
            //this._rotateAroundSelf(angleX, angleY);
            this._rotateAroundFocus(angleX, angleY);
        } else {
            this._rotateAroundFocus(angleX, angleY);
        }
    }

    if (this._isTranslating) {
        const moveX = -dx * this.translationSpeed * this._focusDistance;
        const moveY =  dy * this.translationSpeed * this._focusDistance;
        this._move([moveX, moveY, 0]);
    }
}

_handleWheel(e) {
    if (e.deltaY !== 0) {
        this._isDirty = true;
    }
    this._zoom(e.deltaY * this.zoomSpeed);
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

_updateCamera() {
    const transform = this._camera.getComponentOfType(Transform);

    const rotation = quat.create();
    quat.rotateY(rotation, rotation, this._yaw);
    quat.rotateX(rotation, rotation, this._pitch);

    const translation = vec3.transformQuat(vec3.create(),
        [0, 0, this._focusDistance], rotation);

    transform.rotation = rotation;
    transform.translation = vec3.add(vec3.create(), this._focus, translation);
}

_rotateAroundFocus(dx, dy) {
    const twopi = Math.PI * 2;
    const halfpi = Math.PI / 2;

    if (dx !== 0 || dy !== 0) {
        this._isDirty = true;
    }

    this._pitch += dy;
    this._pitch = Math.min(Math.max(this._pitch, -halfpi), halfpi);

    this._yaw += dx;
    this._yaw = ((this._yaw % twopi) + twopi) % twopi;
}

_move(v) {
    const rotation = quat.create();
    quat.rotateY(rotation, rotation, this._yaw);
    quat.rotateX(rotation, rotation, this._pitch);
    vec3.transformQuat(v, v, rotation);
    vec3.add(this._focus, this._focus, v);
    this._isDirty = true;
}

_zoom(amount) {
    this._focusDistance *= Math.exp(amount);
}

update(t, dt) {
    let dx = 0;
    let dz = 0;

    if (this._forward) {
        dz -= this.moveSpeed * this._focusDistance * dt;
    }
    if (this._backward) {
        dz += this.moveSpeed * this._focusDistance * dt;
    }
    if (this._left) {
        dx -= this.moveSpeed * this._focusDistance * dt;
    }
    if (this._right) {
        dx += this.moveSpeed * this._focusDistance * dt;
    }

    if (dx !== 0 || dz !== 0) {
        this._move([dx, 0, dz]);
    }

    if (this._isDirty) {
        this._updateCamera();
        this._isDirty = false;
        this.dispatchEvent(new Event('update'));
    }
}

}
