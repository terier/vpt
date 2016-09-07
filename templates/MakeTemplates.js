var fs = require('fs');

var templates = {};

process.argv.slice(2).forEach(function(arg) {
    var html = fs.readFileSync(arg, 'utf8');
    templates[arg] = html;
});

var data = '(function(global) { Templates = ' + JSON.stringify(templates) + ';})(this);';
fs.writeFile('Templates.js', data, 'utf8');