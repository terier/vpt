var fs = require('fs');

var programs = {};

process.argv.slice(2).forEach(function(arg) {
    var programData = JSON.parse(fs.readFileSync(arg, 'utf8'));
    var program = {};
    Object.keys(programData.shaders).forEach(function(type) {
        var source = fs.readFileSync(programData.shaders[type], 'utf8');
        program[type] = source;
        programs[programData.name] = program;
    });
});

var data = '(function(global) { Shaders = ' + JSON.stringify(programs) + ';})(this);';
fs.writeFile('Shaders.js', data, 'utf8');