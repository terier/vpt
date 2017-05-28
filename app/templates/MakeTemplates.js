var fs = require('fs');

var templates = {};

process.argv.slice(2).forEach(function(arg) {
    var html = fs.readFileSync(arg, 'utf8');
    templates[arg] = html;
});

var data = 'TEMPLATES = ' + JSON.stringify(templates) + ';';
fs.writeFile('TEMPLATES.js', data, 'utf8');