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

var data = 'SHADERS = ' + JSON.stringify(programs) + ';';
fs.writeFile('SHADERS.js', data, 'utf8');