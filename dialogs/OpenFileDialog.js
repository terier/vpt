(function(global) {

var $html       = $(TEMPLATES["OpenFileDialog.html"]);
var $input      = $html.find('#open-file-input')[0];
var $dimensions = $html.find('#open-file-dimensions');
var $scale      = $html.find('#open-file-scale');
var $bits       = $html.find('#open-file-bits');

function parse() {
    OpenFileDialog.file = $input.files[0];
    OpenFileDialog.dimensions = $dimensions.val().trim().split(/\s+/).map(parseInt);
    OpenFileDialog.scale = $scale.val().trim().split(/\s+/).map(parseFloat);
    OpenFileDialog.bits = parseInt($bits.val().trim());
}

$(function() {
    $html.dialog({
        title: 'Open file',
        modal: true,
        autoOpen: false,
        buttons: {
            'Load': function() {
                if ($input.files.length > 0) {
                    parse();
                    var reader = new FileReader();
                    reader.onload = OpenFileDialog.onload;
                    reader.onerror = OpenFileDialog.onerror;
                    reader.readAsArrayBuffer(file);
                }
                $html.dialog('close');
            },
            'Cancel': function() {
                $html.dialog('close');
            }
        }
    });
});

var OpenFileDialog = {
    dialog:     $html.dialog.bind($html),
    onload:     noop,
    onerror:    noop,
    oncancel:   noop
};

global.OpenFileDialog = OpenFileDialog;

})(this);
