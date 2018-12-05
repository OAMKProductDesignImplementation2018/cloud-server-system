
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
      var _currentData = [];
      var connection = new Connection(config);

      try{
      connection.on('connect', function(err) {
        context.log("Connected");
        var request = new Request(query, function(err) {
          if (err) {
            context.log(err);}
          });

         request.on('row', function(columns) {
           var tempObject = {};
             columns.forEach(function(element) {
               tempObject[element.metadata.colName] = element.value;
                    }, this);
           _currentData.push(tempObject);
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

function doqueryWithCustomRequest(context, request)
{
  return new Promise(function(resolve, reject) {
    var _currentData = [];
    var connection = new Connection(config);
    try{
      connection.on('connect', function(err) {
        context.log("Connected");
        request.on('row', function(columns) {
          var tempObject = {};
          columns.forEach(function(element) {
            tempObject[element.metadata.colName] = element.value;
          }, this);
          _currentData.push(tempObject);
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

function findPersonDetails(context, personid)
{
  const query = "SELECT FirstName, LastName, GroupID FROM dbo.Persons WHERE PersonID = @PersonID";

  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("PersonID", TYPES.VarChar, personid);
  return doqueryWithCustomRequest(context, request);
}

function insertUser(context, fname, lname, email, pword)
{
  const query = "INSERT INTO dbo.Persons (FirstName, LastName, Email, Pword) VALUES (@FirstName, @LastName, @Email, @Pword)";
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("FirstName", TYPES.VarChar, fname);
  request.addParameter("LastName", TYPES.VarChar, lname);
  request.addParameter("Email", TYPES.VarChar, email);
  request.addParameter("Pword", TYPES.VarChar, pword);
  //request.addParameter("Salt", TYPES.VarChar, salt);
  return doqueryWithCustomRequest(context, request);
}

module.exports = {
  querydb: doquery,
  findperson: findPersonDetails,
  newuser: insertUser
};
