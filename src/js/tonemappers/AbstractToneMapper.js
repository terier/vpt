import { PropertyBag } from '../PropertyBag.js';
import { SingleBuffer } from '../SingleBuffer.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class AbstractToneMapper extends PropertyBag {

constructor(gl) {
    super();

    this._gl = gl;

    this._clipQuadProgram = buildPrograms(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;
}

destroy() {
    const gl = this._gl;

    gl.deleteProgram(this._clipQuadProgram.program);
}

}
