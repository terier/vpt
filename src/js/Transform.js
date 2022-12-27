import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';
import { Component } from './Component.js';

export class Transform extends Component {

#localRotation = [0, 0, 0, 1];
#localTranslation = [0, 0, 0];
#localScale = [1, 1, 1];

constructor(node) {
    super(node);
}

get localRotation() {
    return quat.clone(this.#localRotation);
}

get localTranslation() {
    return vec3.clone(this.#localTranslation);
}

get localScale() {
    return vec3.clone(this.#localScale);
}

get localMatrix() {
    return mat4.fromRotationTranslationScale(mat4.create(),
        this.#localRotation, this.#localTranslation, this.#localScale);
}

get globalRotation() {
    return mat4.getRotation(quat.create(), this.globalMatrix);
}

get globalTranslation() {
    return mat4.getTranslation(vec3.create(), this.globalMatrix);
}

get globalScale() {
    return mat4.getScale(vec3.create(), this.globalMatrix);
}

get globalMatrix() {
    if (this.node.parent) {
        const globalMatrix = this.node.parent.globalMatrix;
        return mat4.multiply(globalMatrix, globalMatrix, this.localMatrix);
    } else {
        return this.localMatrix;
    }
}

get inverseLocalRotation() {
    return quat.invert(quat.create(), this.#localRotation);
}

get inverseLocalTranslation() {
    return vec3.negate(vec3.create(), this.#localTranslation);
}

get inverseLocalScale() {
    return vec3.inverse(vec3.create(), this.#localScale);
}

get inverseLocalMatrix() {
    const matrix = mat4.create();
    mat4.scale(matrix, matrix, this.inverseLocalScale);
    mat4.multiply(matrix, matrix, mat4.fromQuat(mat4.create(), this.inverseLocalRotation));
    mat4.translate(matrix, matrix, this.inverseLocalTranslation);
    return matrix;
}

get inverseGlobalRotation() {
    const globalRotation = this.globalRotation;
    return quat.invert(globalRotation, globalRotation);
}

get inverseGlobalTranslation() {
    const globalTranslation = this.globalTranslation;
    return vec3.negate(globalTranslation, globalTranslation);
}

get inverseGlobalScale() {
    const globalScale = this.globalScale;
    return vec3.inverse(globalScale, globalScale);
}

get inverseGlobalMatrix() {
    if (this.node.parent) {
        const inverseGlobalMatrix = this.node.parent.inverseGlobalMatrix;
        return mat4.multiply(inverseGlobalMatrix, this.inverseLocalMatrix, inverseGlobalMatrix);
    } else {
        return this.inverseLocalMatrix;
    }
}

set localRotation(localRotation) {
    this.#localRotation = quat.clone(localRotation);
    this.dispatchEvent(new Event('change'));
}

set localTranslation(localTranslation) {
    this.#localTranslation = vec3.clone(localTranslation);
    this.dispatchEvent(new Event('change'));
}

set localScale(localScale) {
    this.#localScale = vec3.clone(localScale);
    this.dispatchEvent(new Event('change'));
}

set localMatrix(localMatrix) {
    mat4.getRotation(this.#localRotation, localMatrix);
    mat4.getTranslation(this.#localTranslation, localMatrix);
    mat4.getScaling(this.#localScale, localMatrix);
    this.dispatchEvent(new Event('change'));
}

set globalRotation(globalRotation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set globalTranslation(globalTranslation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set globalScale(globalScale) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set globalMatrix(globalMatrix) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseLocalRotation(inverseLocalRotation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseLocalTranslation(inverseLocalTranslation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseLocalScale(inverseLocalScale) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseLocalMatrix(inverseLocalMatrix) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseGlobalRotation(inverseGlobalRotation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseGlobalTranslation(inverseGlobalTranslation) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseGlobalScale(inverseGlobalScale) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

set inverseGlobalMatrix(inverseGlobalMatrix) {
    throw new Error('Not implemented');
    this.dispatchEvent(new Event('change'));
}

}
