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

    var openFileDialog = $(Templates["OpenFileDialog.html"]);
    openFileDialog.dialog({
        title: 'Open file',
        width: 300,
        height: 300,
        modal: true,
        autoOpen: false,
        buttons: {
            'Load': function() {
                var $this = $(this);
                var input = $this.find('#open-file-input')[0];
                if (input.files.length > 0) {
                    var file = input.files[0];
                    var dimensions = $this
                        .find('#open-file-dimensions')
                        .val().trim().split(/\s+/)
                        .map(function(x) { return parseInt(x); });
                    var bits = parseInt($this.find('#open-file-bits')
                        .val().trim());
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var volume = new Volume(
                            reader.result,
                            dimensions[0],
                            dimensions[1],
                            dimensions[2],
                            bits);
                        renderer.setVolume(volume);
                    };
                    reader.onerror = function(e) {
                        alert('Error while loading');
                    };
                    reader.readAsArrayBuffer(file);
                }
                $this.dialog('close');
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