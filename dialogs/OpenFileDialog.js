(function(global) {

var $html       = $(TEMPLATES["OpenFileDialog.html"]);
var $input      = $html.find('#open-file-input')[0];
var $dimensions = $html.find('#open-file-dimensions');
var $scale      = $html.find('#open-file-scale');
var $bits       = $html.find('#open-file-bits');

$(function() {
    $html.dialog({
        title: 'Open file',
        modal: true,
        autoOpen: false,
        buttons: {
            'Load': function() {
                if ($input.files.length > 0) {
                    var file = $input.files[0];
                    var dimensions = $dimensions
                        .val().trim().split(/\s+/)
                        .map(function(x) { return parseInt(x); });
                    var scale = $scale
                        .val().trim().split(/\s+/)
                        .map(function(x) { return parseFloat(x); });
                    var bits = parseInt($bits.val().trim());
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var volume = new Volume(
                            reader.result,
                            dimensions[0],
                            dimensions[1],
                            dimensions[2],
                            bits);
                        renderer.setVolume(volume);
                        renderer.setScale(scale[0], scale[1], scale[2]);
                    };
                    reader.onerror = function(e) {
                        alert('Error while loading');
                    };
                    reader.readAsArrayBuffer(file);
                }
                $html.dialog('close');
            },
            'Cancel': function() {
                $html.dialog('close');
            }
        }
    });
})

global.OpenFileDialog = $html;

})(this);
