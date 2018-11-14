var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

module.exports = function (context, req) {

    var _currentData = {};
    var config = {
        userName: 'username',
        password: 'password',
        server: 'server',
        options: {encrypt: true, database: 'dbname'}
    };

    var connection = new Connection(config);
    connection.on('connect', function(err) {
        context.log("Connected");
        getData();
    });

    function getData() {

        request = new Request('SELECT ID, FirstName, LastName FROM dbo.Person', function(err) {
        if (err) {
            context.log(err);}
        });

        request.on('row', function(columns) {
            // prints ID and name to log
            _currentData.ID = columns[0].value;
            _currentData.FirstName = columns[1].value;
            _currentData.LastName = columns[2].value;
            context.log(_currentData);
        });

        request.on('requestCompleted', function () {
            context.log('Request completed.');
        });
        connection.execSql(request);
    }


    context.done();
};