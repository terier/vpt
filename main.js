$(function() {
    var renderer = new VolumeRenderer(document.getElementById('viewer'));

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

    var openFileDialog = $('<div><input type="file"></div>');
    openFileDialog.dialog({
        title: 'Open file',
        width: 300,
        height: 150,
        modal: true,
        resizable: false,
        autoOpen: false,
        buttons: {
            'Load': function() {
                // TODO: load file
                $(this).dialog('close');
            },
            'Cancel': function() {
                $(this).dialog('close');
            }
        }
    });

    $('#open-file').click(function() {
        openFileDialog.dialog('open');
    });
});