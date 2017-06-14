$(function() {
'use strict';

var context = new RenderingContext();
var $canvas = $(context.getCanvas());
$canvas.addClass('renderer');
$(document.body).append($canvas);

$(window).resize(function() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    context.resize(w, h);
});
$(window).resize();

(function render() {
    context.render();
    requestAnimationFrame(render);
})();

$('#open-file').click(function() {
    OpenFileDialog.onload = function(e) {
        var size = OpenFileDialog.size;
        var bits = OpenFileDialog.bits;
        var volume = new Volume(e.target.result, size.x, size.y, size.z, bits);
        context.setVolume(volume);
    }
    OpenFileDialog.dialog('show');
});

});
