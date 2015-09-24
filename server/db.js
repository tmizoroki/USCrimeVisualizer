// Sets the mongo database
var mongoose = require('mongoose');

var mongoURI = 'mongodb://localhost/USCrime';
mongoose.connect(mongoURI);

// Run in seperate terminal window using 'mongod'
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
 console.log('Mongodb connection open');
});

module.exports = db;