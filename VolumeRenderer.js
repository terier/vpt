(function(global) {

global.VolumeRenderer = VolumeRenderer;
function VolumeRenderer(canvas) {
    var raycaster = new VolumeRayCaster(canvas);
    var resizeHorizontally = true;

    this.resize = function(width, height) {
        raycaster.resize(width, height);
        if (resizeHorizontally) {
            var scale = width / height;
            raycaster.camera.fovX = Math.atan(Math.tan(raycaster.camera.fovY / 2) * scale) * 2;
        } else {
            var scale = height / width;
            raycaster.camera.fovY = Math.atan(Math.tan(raycaster.camera.fovX / 2) * scale) * 2;
        }
    };

    this.zoom = function(amount) {
        var k = 0.01;
        var scale = Math.exp(amount * k);
        raycaster.camera.fovX = Math.atan(Math.tan(raycaster.camera.fovX / 2) * scale) * 2;
        raycaster.camera.fovY = Math.atan(Math.tan(raycaster.camera.fovY / 2) * scale) * 2;
    };

    this.setVolume = function(volume) {
        raycaster.setVolume(volume);
    };

    this.render = function() {
        raycaster.render();
    };

    var lastX = 0, lastY = 0;
    var isMoving = false;
    this.onMouseDown = function(e) {
        isMoving = true;
        lastX = e.clientX;
        lastY = e.clientY;
    }.bind(this);

    this.onMouseUp = function(e) {
        isMoving = false;
    }.bind(this);

    this.onMouseMove = function(e) {
        if (isMoving) {
            var x = e.clientX;
            var y = e.clientY;
            var dx = x - lastX;
            var dy = y - lastY;

            var speed = 0.002;
            var scale = speed * Math.min(raycaster.camera.fovX, raycaster.camera.fovY);

            var qx = new Quaternion(0, 1, 0, dx * scale).fromAxisAngle();
            var qy = new Quaternion(1, 0, 0, dy * scale).fromAxisAngle();
            var rot = raycaster.camera.rotation;
            rot.multiply(qx, rot);
            rot.multiply(qy, rot);
            this.render();
        }

        lastX = x;
        lastY = y;
    }.bind(this);

    this.onWheel = function(e) {
        this.zoom(e.deltaY);
        this.render();
    }.bind(this);

    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('wheel', this.onWheel);

    function temprender() {
        raycaster.render();
        requestAnimationFrame(temprender);
    }
    requestAnimationFrame(temprender);

}

global.VolumeRayCaster = VolumeRayCaster;
function VolumeRayCaster(canvas) {
    var volume, gl, vbo, program;
    var camera;
    var self = this;

    function init() {
        camera = self.camera = new Camera();

        try {
            gl = WebGLUtils.getContext(canvas, ['webgl2', 'experimental-webgl2']);

            // create volume
            volume = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_3D, volume);
            gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
                1, 1, 1,
                0, gl.RED, gl.FLOAT, new Float32Array([1]));
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_3D, null);

            // create quad
            vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,1,1,-1,1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            // create shaders
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
        var uMvpInverseMatrix = new Matrix();
        var volumeTransformation = new Matrix().fromTranslation(-0.5, -0.5, -0.5);

        return function() {
            if (!gl) {
                return;
            }

            // update camera
            var angle = +Date.now() * 0.005;
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            camera.position.set(0, 0, -5);
            camera.updateTransformation();
            uMvpInverseMatrix.multiply(camera.projectionMatrix, camera.viewMatrix);
            uMvpInverseMatrix.multiply(uMvpInverseMatrix, volumeTransformation);
            uMvpInverseMatrix.inverse().transpose();

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
            gl.uniformMatrix4fv(program.uniforms['uMvpInverseMatrix'], false, uMvpInverseMatrix.m);

            // render
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            // clean up
            gl.disableVertexAttribArray(aPosition);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindTexture(gl.TEXTURE_3D, null);
        }
    }();

    init();

}

})(this);