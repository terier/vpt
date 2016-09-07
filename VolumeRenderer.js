(function(global) {

global.VolumeRenderer = VolumeRenderer;
function VolumeRenderer(canvas) {
    var raycaster = new VolumeRayCaster(canvas);

    this.resize = function(width, height) {
        raycaster.resize(width, height);
    };

    this.setVolume = function(volume) {
        raycaster.setVolume(volume);
    };

    this.render = function() {
        raycaster.render();
    };

    this.onMouseDown = function(e) {
        e.preventDefault();
        this.render();
    }.bind(this);

    canvas.addEventListener('mousedown', this.onMouseDown);

}

global.VolumeRayCaster = VolumeRayCaster;
function VolumeRayCaster(canvas) {
    var volume, gl, vbo, program;
    var orientation, position, matrix;

    function init() {
        orientation = new Quaternion();
        position = new Vector();
        matrix = new Matrix();

        try {
            gl = WebGLUtils.getContext(canvas, ['webgl2', 'experimental-webgl2']);
            volume = gl.createTexture();

            vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,1,1,-1,1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            program = WebGLUtils.createProgram(gl, [
                WebGLUtils.createShader(gl, Shaders.mip.vertex, gl.VERTEX_SHADER),
                WebGLUtils.createShader(gl, Shaders.mip.fragment, gl.FRAGMENT_SHADER)
            ]);
        } catch(e) {
            gl = undefined;
            console.error(e);
        }
    }

    this.resize = function(width, height) {
        canvas.width = width;
        canvas.height = height;
        if (gl) {
            gl.viewport(0, 0, width, height);
        }
    };

    this.setVolume = function(_volume) {
        if (!gl) {
            return;
        }

        gl.bindTexture(gl.TEXTURE_3D, volume);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
            _volume.width, _volume.height, _volume.depth,
            0, gl.RED, gl.FLOAT, _volume.data);
        gl.bindTexture(gl.TEXTURE_3D, null);
    };

    this.render = function() {
        if (!gl) {
            return;
        }

        // use shader
        gl.useProgram(program.program);

        // set volume
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, volume);

        // set vbo
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        var aPosition = program.attributes['aPosition'];
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        // set uniforms
        gl.uniform1i(program.uniforms['uVolume'], 0);

        // render
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        // clean up
        gl.disableVertexAttribArray(aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_3D, null);
    };

    init();

}

})(this);