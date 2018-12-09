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

function findAllPersonDetails(context, email)
{
  const query = "SELECT * FROM dbo.Persons WHERE Email = @Email";

  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("Email", TYPES.VarChar, email);
  return doqueryWithCustomRequest(context, request);
}

function insertUser(context, fname, lname, email, pword, salt)
{
  const query = "INSERT INTO dbo.Persons (FirstName, LastName, Email, Pword, Salt) VALUES (@FirstName, @LastName, @Email, @Pword, @Salt)";
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("FirstName", TYPES.VarChar, fname);
  request.addParameter("LastName", TYPES.VarChar, lname);
  request.addParameter("Email", TYPES.VarChar, email);
  request.addParameter("Pword", TYPES.VarChar, pword);
  request.addParameter("Salt", TYPES.VarChar, salt);
  return doqueryWithCustomRequest(context, request);
}

function getLoginCredentials(context, email)
{
    const query = "SELECT Pword, Salt FROM dbo.Persons WHERE Email = @Email";
    var request = new Request(query, function(err) {
        if (err) {
          context.log(err);}
      });
      request.addParameter("Email", TYPES.VarChar, email);
      return doqueryWithCustomRequest(context, request);
}

function checkDuplicateEmail(context, email)
{
    const query = "SELECT CASE WHEN EXISTS (SELECT * FROM dbo.Persons WHERE Email = @Email) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS RESULT";
    var request = new Request(query, function(err) {
        if (err) {
          context.log(err);}
      });
      request.addParameter("Email", TYPES.VarChar, email);
      return doqueryWithCustomRequest(context, request);
}

function verifyEmail(context, email)
{
    const query = "SELECT CASE WHEN EXISTS (SELECT * FROM dbo.ApprovedEmails WHERE Email = @Email) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS RESULT";
    context.log(email);
    var request = new Request(query, function(err) {
        if (err) {
          context.log(err);}
      });
      request.addParameter("Email", TYPES.VarChar, email);
      return doqueryWithCustomRequest(context, request);
}

function updateUser(context, id, fname, lname, groupid, gender, restaurantid, g, l , vl, m, vh, veg, vs, a)
{
  const query = "UPDATE dbo.Persons (FirstName, LastName, GroupID, Gender, RestaurantID) SET (@FirstName, @LastName, @GroupID, @Gender, @RestaurantID) WHERE ID = @ID";
  const query = "UPDATE dbo.Dietary (G, L, VL, M, VH, VEG, VS, A) SET (@G, @L, @VL, @M, @VH, @VEG, @VS, @A) WHERE UserID = @ID";
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("ID", TYPES.Int, id);
  request.addParameter("FirstName", TYPES.VarChar, fname);
  request.addParameter("LastName", TYPES.VarChar, lname);
  request.addParameter("GroupID", TYPES.VarChar, groupid);
  request.addParameter("Gender", TYPES.VarChar, gender);
  request.addParameter("RestaurantID", TYPES.Int, restaurantid);

  request.addParameter("G", TYPES.Bit, g);
  request.addParameter("L", TYPES.Bit, l);
  request.addParameter("VL", TYPES.Bit, vl);
  request.addParameter("M", TYPES.Bit, m);
  request.addParameter("VH", TYPES.Bit, vh);
  request.addParameter("VEG", TYPES.Bit, veg);
  request.addParameter("VS", TYPES.Bit, vs);
  request.addParameter("A", TYPES.Bit, a);

  return doqueryWithCustomRequest(context, request);
}

module.exports = {
  querydb: doquery,
  findperson: findPersonDetails,
  newuser: insertUser,
  login: getLoginCredentials,
  checkEmail : verifyEmail,
  duplicateEmail: checkDuplicateEmail,
  findAllData : findAllPersonDetails,
  update: updateUser
};