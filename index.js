const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 8100;
const isViable = require('./src/isviable.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

/*
 * Demo page of Carpooling use
 */
app.use('/', express.static(path.join(__dirname, '/views/demo')));
/*
 * Info page of Carpooling use
 */
app.use('/info', express.static(path.join(__dirname, '/views/info')));


app.post('/isViable', isViable);

app.listen(port, function () {
	console.log("Carpooling started at " + port);
});


