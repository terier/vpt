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

    $('#open-file').click(function() {
        OpenFileDialog.onload = function(e) {
            var dimensions = OpenFileDialog.dimensions;
            var scale = OpenFileDialog.scale;
            var bits = OpenFileDialog.bits;
            var volume = new Volume(e.target.result, dimensions[0], dimensions[1], dimensions[2], bits);
            renderer.setVolume(volume);
            renderer.setScale(scale[0], scale[1], scale[2]);
        }
        OpenFileDialog.dialog('open');
    });
});
