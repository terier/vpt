$(function() {
    var renderer = new VolumeRenderer();
    $('.fill').append($(renderer.getCanvas()));

    $(window).resize(function() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        $('.fill').css({
            width: w,
            height: h,
            position: 'fixed'
        });
        renderer.resize(w, h);
    });
    $(window).resize();

    $('#open-file').click(function() {
        OpenFileDialog.dialog('open');
    });
});
