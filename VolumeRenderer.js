(function(global) {

global.VolumeRenderer = VolumeRenderer;

function VolumeRenderer(canvas) {
    var volume = null;
    var gl = null;

    init();

    function init() {
        try {
            gl = WebGLUtils.getContext(canvas, ['webgl2', 'experimental-webgl2']);
        } catch(e) {
        }
    }

    this.resize = function(width, height) {
        canvas.width = width;
        canvas.height = height;
        if (gl) {
            gl.viewport(0, 0, width, height);
        }
    };
}

})(this);