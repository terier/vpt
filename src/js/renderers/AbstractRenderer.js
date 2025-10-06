import { mat4 } from '../../lib/gl-matrix-module.js';

import { PropertyBag } from '../PropertyBag.js';
import { SingleBuffer } from '../SingleBuffer.js';
import { DoubleBuffer } from '../DoubleBuffer.js';

import { Camera } from '../Camera.js';
import { Volume } from '../Volume.js';
import { Transform } from '../Transform.js';

import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../SceneUtils.js';

import {
    buildPrograms,
    createTexture,
} from '../WebGL.js';

import { SHADERS, MIXINS } from '../shaders.js';

export class AbstractRenderer extends PropertyBag {

constructor(gl) {
    super();

    this._gl = gl;

    this._transferFunction = createTexture(gl, {
        width   : 2,
        height  : 1,
        data    : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),

        iformat : gl.SRGB8_ALPHA8,
        format  : gl.RGBA,
        type    : gl.UNSIGNED_BYTE,

        wrapS   : gl.CLAMP_TO_EDGE,
        wrapT   : gl.CLAMP_TO_EDGE,
        min     : gl.LINEAR,
        mag     : gl.LINEAR,
    });

    this.lastMatrix = mat4.create();
}

calculatePVMMatrix(scene) {
    const volume = scene.find(node => node.getComponentOfType(Volume));
    const camera = scene.find(node => node.getComponentOfType(Camera));

    const centerMatrix = mat4.fromTranslation(mat4.create(), [-0.5, -0.5, -0.5]);
    const modelMatrix = getGlobalModelMatrix(volume);
    const viewMatrix = getGlobalViewMatrix(camera);
    const projectionMatrix = getProjectionMatrix(camera);

    const matrix = mat4.create();
    mat4.multiply(matrix, centerMatrix, matrix);
    mat4.multiply(matrix, modelMatrix, matrix);
    mat4.multiply(matrix, viewMatrix, matrix);
    mat4.multiply(matrix, projectionMatrix, matrix);

    return matrix;
}

destroy() {
    const gl = this._gl;
    gl.deleteTexture(this._transferFunction);
}

setTransferFunction(transferFunction) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
}

}
