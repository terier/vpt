$(function() {

var renderer = new VolumeRenderer();
var $canvas = $(renderer.getCanvas());
$canvas.addClass('renderer');
$(document.body).append($canvas);

$(window).resize(function() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.resize(w, h);
});
$(window).resize();

(function render() {
    renderer.render();
    requestAnimationFrame(render);
})();

$('#open-file').click(function() {
    OpenFileDialog.onload = function(e) {
        var size = OpenFileDialog.size;
        var bits = OpenFileDialog.bits;
        var volume = new Volume(e.target.result, size.x, size.y, size.z, bits);
        renderer.setVolume(volume);
    }
    OpenFileDialog.dialog('show');
});

});
