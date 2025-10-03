export class Volume {

    constructor(gl, {
        size = [1, 1, 1],
        datatype = 'unorm8',
        filter = 'linear',
    } = {}) {
        // TODO proper format
        const format = gl.RED;
        const type = gl.UNSIGNED_BYTE;
        let iformat;
        switch (datatype) {
            case 'unorm8': iformat = gl.R8; break;
            default: throw new Error(`Volume: datatype '${datatype}' not supported`);
        }

        const texture = gl.createTexture();
        const [width, height, depth] = size;
        gl.bindTexture(gl.TEXTURE_3D, texture);
        gl.texStorage3D(gl.TEXTURE_3D, 1, iformat,
            width, height, depth);

        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        this.gl = gl;
        this.size = size;
        this.datatype = datatype;
        this.texture = texture;
        this.filter = filter;
        this.format = format;
        this.iformat = iformat;
        this.type = type;
    }

    writeData(data, origin = [0, 0, 0], extent = [1, 1, 1]) {
        const { gl, texture, size, format, type } = this;
        const [width, height, depth] = size;
        gl.bindTexture(gl.TEXTURE_3D, texture);
        gl.texSubImage3D(gl.TEXTURE_3D, 0,
            ...origin,
            ...extent,
            format, type, new Uint8Array(data));
    }

    setFilter(filter) {
        const { gl, texture } = this;

        this.filter = filter;
        const glfilter = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
        gl.bindTexture(gl.TEXTURE_3D, texture);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, glfilter);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, glfilter);
    }

    destroy() {
        const { gl, texture } = this;
        gl.deleteTexture(texture);
    }

}
