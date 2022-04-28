import { DOMUtils } from '../../utils/DOMUtils.js';
import { CommonUtils } from '../../utils/CommonUtils.js';
import { WebGL } from '../../WebGL.js';
import { Draggable } from '../../Draggable.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

const [ templateElement, templateBump ] = await Promise.all([
    new URL('./TransferFunction.html', import.meta.url),
    new URL('./TransferFunctionBump.html', import.meta.url),
].map(url => fetch(url).then(response => response.text())));

const template = document.createElement('template');
template.innerHTML = templateElement;

export class TransferFunction extends HTMLElement {

constructor() {
    super();

    this.changeListener = this.changeListener.bind(this);

    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.appendChild(template.content.cloneNode(true));
    this.binds = DOMUtils.bind(this.shadow);

    Object.assign(this, {
        width                  : 256,
        height                 : 256,
        transferFunctionWidth  : 256,
        transferFunctionHeight : 256,
        scaleSpeed             : 0.003
    });

    this.canvas = this.shadow.querySelector('canvas');
    this.canvas.width = this.transferFunctionWidth;
    this.canvas.height = this.transferFunctionHeight;
    this.resize(this.width, this.height);

    this._gl = this.canvas.getContext('webgl2', {
        depth                 : false,
        stencil               : false,
        antialias             : false,
        preserveDrawingBuffer : true
    });
    const gl = this._gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this._clipQuad = WebGL.createClipQuad(gl);
    this._program = WebGL.buildPrograms(gl, {
        TransferFunction: SHADERS.TransferFunction
    }, MIXINS).TransferFunction;
    const program = this._program;
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(program.attributes.aPosition);
    gl.vertexAttribPointer(program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);

    this.bumps = [];
    this.binds.addBump.addEventListener('click', e => {
        this.addBump();
    });
    this.binds.removeSelectedBump.addEventListener('click', e => {
        this.removeSelectedBump();
    });
    this.binds.removeAllBumps.addEventListener('click', e => {
        this.removeAllBumps();
    });

    this.binds.color.addEventListener('change', this.changeListener);
    this.binds.alpha.addEventListener('change', this.changeListener);

    this.binds.load.addEventListener('click', e => {
        CommonUtils.readTextFile(data => {
            this.bumps = JSON.parse(data);
            this.render();
            this._rebuildHandles();
            this.dispatchEvent(new Event('change'));
        });
    });

    this.binds.save.addEventListener('click', e => {
        CommonUtils.downloadJSON(this.bumps, 'TransferFunction.json');
    });
}

destroy() {
    const gl = this._gl;
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._program.program);
}

resize(width, height) {
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.width = width;
    this.height = height;
}

resizeTransferFunction(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.transferFunctionWidth = width;
    this.transferFunctionHeight = height;
    const gl = this._gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

render() {
    const gl = this._gl;
    const { uniforms } = this._program;

    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const bump of this.bumps) {
        gl.uniform2f(uniforms.uPosition, bump.position.x, bump.position.y);
        gl.uniform2f(uniforms.uSize, bump.size.x, bump.size.y);
        gl.uniform4f(uniforms.uColor, bump.color.r, bump.color.g, bump.color.b, bump.color.a);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

get value() {
    return this.canvas;
}

addBump(options) {
    const bumpIndex = this.bumps.length;
    const newBump = {
        position: {
            x: 0.5,
            y: 0.5,
        },
        size: {
            x: 0.2,
            y: 0.2,
        },
        color: {
            r: 1,
            g: 0,
            b: 0,
            a: 1,
        },
    };
    this.bumps.push(newBump);
    this._addHandle(bumpIndex);
    this.selectBump(bumpIndex);
    this.render();
    this.dispatchEvent(new Event('change'));
}

removeSelectedBump() {
    this._removeHandle(this.getSelectedBumpIndex());
}

removeAllBumps() {
    this.bumps = [];
    this._rebuildHandles();
    this.render();
    this.dispatchEvent(new Event('change'));
}

_removeHandle(index) {
    const handles = this.shadow.querySelectorAll('.bump');
    for (const handle of handles) {
        const handleIndex = parseInt(handle.dataset.index);
        if (handleIndex === index) {
            this.bumps.splice(handleIndex, 1);
        }
    }
    this._rebuildHandles();
    this.render();
    this.dispatchEvent(new Event('change'));
}

_addHandle(index) {
    const handle = DOMUtils.instantiate(templateBump);
    this.shadow.querySelector('.widget').appendChild(handle);
    handle.dataset.index = index;

    const left = this.bumps[index].position.x * this.width;
    const top = (1 - this.bumps[index].position.y) * this.height;
    handle.style.left = Math.round(left) + 'px';
    handle.style.top = Math.round(top) + 'px';

    new Draggable(handle, handle.querySelector('.bump-handle'));
    handle.addEventListener('draggable', e => {
        const x = e.currentTarget.offsetLeft / this.width;
        const y = 1 - (e.currentTarget.offsetTop / this.height);
        const i = parseInt(e.currentTarget.dataset.index);
        this.bumps[i].position.x = x;
        this.bumps[i].position.y = y;
        this.render();
        this.dispatchEvent(new Event('change'));
    });
    handle.addEventListener('pointerdown', e => {
        const i = parseInt(e.currentTarget.dataset.index);
        this.selectBump(i);
    });
    handle.addEventListener('wheel', e => {
        const amount = e.deltaY * this.scaleSpeed;
        const scale = Math.exp(-amount);
        const i = parseInt(e.currentTarget.dataset.index);
        this.selectBump(i);
        if (e.shiftKey) {
            this.bumps[i].size.y *= scale;
        } else {
            this.bumps[i].size.x *= scale;
        }
        this.render();
        this.dispatchEvent(new Event('change'));
    });
}

_rebuildHandles() {
    const handles = this.shadow.querySelectorAll('.bump');
    for (const handle of handles) {
        handle.remove();
    }
    for (let i = 0; i < this.bumps.length; i++) {
        this._addHandle(i);
    }
}

selectBump(index) {
    const handles = this.shadow.querySelectorAll('.bump');
    for (const handle of handles) {
        const handleIndex = parseInt(handle.dataset.index);
        if (handleIndex === index) {
            handle.classList.add('selected');
        } else {
            handle.classList.remove('selected');
        }
    }

    const color = this.bumps[index].color;
    this.binds.color.value = CommonUtils.rgb2hex([color.r, color.g, color.b]);
    this.binds.alpha.value = color.a;
}

getSelectedBumpIndex() {
    const selectedBump = this.shadow.querySelector('.bump.selected');
    if (selectedBump) {
        return parseInt(selectedBump.dataset.index);
    } else {
        return -1;
    }
}

changeListener() {
    const selectedBump = this.shadow.querySelector('.bump.selected');
    const index = parseInt(selectedBump.dataset.index);
    const color = CommonUtils.hex2rgb(this.binds.color.value);
    const alpha = parseFloat(this.binds.alpha.value);
    this.bumps[index].color.r = color[0];
    this.bumps[index].color.g = color[1];
    this.bumps[index].color.b = color[2];
    this.bumps[index].color.a = alpha;
    this.render();
    this.dispatchEvent(new Event('change'));
}

}

customElements.define('ui-transfer-function', TransferFunction);
