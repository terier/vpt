var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);

app.use('/static', express.static('build/css'));
app.use('/static', express.static('build/images'));
app.use('/static', express.static('build/js'));

app.get('/', function(req, res) {
    res.send('Hello World!');
});

app.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'));
});
