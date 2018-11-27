var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

var config = {
        userName: process.env['DBusername'],
        password: process.env['DBpassword'],
        server: process.env['DBserver'],
        options: {encrypt: true, database: process.env['DBname']}
      };

function doquery(context, query)
{
 return new Promise(function(resolve, reject) {
      var _currentData = new Array();
      var connection = new Connection(config);

      try{
      connection.on('connect', function(err) {
        context.log("Connected");
        var request = new Request(query, function(err) {
          if (err) {
            context.log(err);}
          });

         request.on('row', function(columns) {
                    columns.forEach(function(element) {
                        _currentData.push([element.metadata.colName,element.value]);
                    }, this);
                });

         request.on('requestCompleted', function () {
                    context.log('Request completed.');
                    resolve(_currentData);
                });
         connection.execSql(request);
        });
       }
       catch(error){reject(error);}
  });
}

module.exports = {
  querydb: doquery
};