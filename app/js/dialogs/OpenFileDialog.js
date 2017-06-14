var OpenFileDialog = (function() {
'use strict';

var $html       = $(TEMPLATES["OpenFileDialog.html"]);
var $input      = $html.find('#open-file-dialog-file')[0];
var $size       = $html.find('input[name="open-file-dialog-size"]');
var $bits       = $html.find('input[name="open-file-dialog-bits"]');
var $open       = $html.find('#open-file-dialog-open');
var $close      = $html.find('#open-file-dialog-close');

function parse() {
    OpenFileDialog.file = $input.files[0];
    OpenFileDialog.size = {
        x: parseInt($size.filter('[data-axis="x"]').val()),
        y: parseInt($size.filter('[data-axis="y"]').val()),
        z: parseInt($size.filter('[data-axis="z"]').val())
    };
    OpenFileDialog.bits = parseInt($bits.filter(':checked').val());
}

$(function() {
    $html.modal({
        show: false
    });
    $open.click(function() {
        if ($input.files.length > 0) {
            parse();
            var reader = new FileReader();
            reader.onload = OpenFileDialog.onload;
            reader.onerror = OpenFileDialog.onerror;
            reader.readAsArrayBuffer(OpenFileDialog.file);
        }
    });
});

return {
    dialog:     $html.modal.bind($html),
    onload:     Util.noop,
    onerror:    Util.noop,
    oncancel:   Util.noop
};

})();
