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
  const query = "SELECT ID, FirstName, LastName, GroupID, RestaurantID FROM dbo.Persons WHERE PersonID = @PersonID";

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

function addDiet(context, email){
    const dietQuery = "INSERT INTO dbo.Dietary (UserID) SELECT ID FROM dbo.Persons WHERE Email = @Email";
    var request = new Request(dietQuery, function(err) {
    if (err) {
        context.log(err);}
    });
    request.addParameter("Email", TYPES.VarChar, email);
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

function updateUser(context, id, fname, lname, groupid, gender, restaurantid)
{
  const query = "UPDATE dbo.Persons SET FirstName = @FirstName, LastName = @LastName, GroupID = @GroupID, Gender = @Gender, RestaurantID = @RestaurantID WHERE ID = @ID";
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("ID", TYPES.Int, parseInt(id));
  request.addParameter("FirstName", TYPES.VarChar, fname);
  request.addParameter("LastName", TYPES.VarChar, lname);
  request.addParameter("GroupID", TYPES.VarChar, groupid);
  request.addParameter("Gender", TYPES.VarChar, gender);
  request.addParameter("RestaurantID", TYPES.Int, parseInt(restaurantid));

  context.log(id);
  return doqueryWithCustomRequest(context, request);
}

function updateDietary(context, id, g, l , vl, m, vh, veg, vs, a)
{
  const query = "UPDATE dbo.Dietary SET G = @G, L = @L, VL = @VL, M = @M, VH = @VH, VEG = @VEG, VS = @VS, A = @A WHERE UserID = @ID";
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("ID", TYPES.Int, parseInt(id));
  request.addParameter("G", TYPES.Bit, parseInt(g));
  request.addParameter("L", TYPES.Bit, parseInt(l));
  request.addParameter("VL", TYPES.Bit, parseInt(vl));
  request.addParameter("M", TYPES.Bit, parseInt(m));
  request.addParameter("VH", TYPES.Bit, parseInt(vh));
  request.addParameter("VEG", TYPES.Bit, parseInt(veg));
  request.addParameter("VS", TYPES.Bit, parseInt(vs));
  request.addParameter("A", TYPES.Bit, parseInt(a));

  return doqueryWithCustomRequest(context, request);
}


function findPersonNotes(context, personid) // en ole varma miten toimii vielä, tehty epä foreign key mallilla
{
  const query = "SELECT * FROM dbo.Notes LEFT OUTER JOIN dbo.Persons ON dbo.Persons.ID = dbo.Notes.PersonID WHERE dbo.Persons.PersonID = @PersonID";

  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("PersonID", TYPES.VarChar, personid);
  return doqueryWithCustomRequest(context, request);
}

function getPersonIDbyUserId(context, userid)
{
  const query = "SELECT PersonID FROM dbo.Persons WHERE ID = @ID";
  
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("ID", TYPES.Int, parseInt(userid));
  return doqueryWithCustomRequest(context, request);
}

function insertImageUrl(context, url, userid)
{
  const query = "UPDATE dbo.Persons SET ImageURL = @ImageURL WHERE ID = @UserID";
  
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("ImageURL", TYPES.VarChar, url);
  request.addParameter("UserID", TYPES.Int, parseInt(userid));
  return doqueryWithCustomRequest(context, request);
}

function updatePersonID(context, userid, personid)
{
  const query = "UPDATE dbo.Persons SET PersonID = @PersonID WHERE ID = @UserID";
  
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("UserID", TYPES.Int, parseInt(userid));
  request.addParameter("PersonID", TYPES.VarChar, personid);
  return doqueryWithCustomRequest(context, request);
}

function updateDeviceToken(context, deviceid, token)
{
  const query = "UPDATE dbo.Devices apikey = @token WHERE deviceid = @id";
  
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("id", TYPES.VarChar, deviceid);
  request.addParameter("token", TYPES.VarChar, token);
  return doqueryWithCustomRequest(context, request);
}

function getDeviceCredentials(context, deviceid)
{
  const query = "SELECT * FROM dbo.Devices WHERE deviceid = @id";
  
  var request = new Request(query, function(err) {
    if (err) {
      context.log(err);}
  });
  request.addParameter("id", TYPES.VarChar, deviceid);
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
  update : updateUser,
  dietary : addDiet,
  updatediet : updateDietary,
  getnotes : findPersonNotes,
  personIdfromId : getPersonIDbyUserId,
  insertImageUrl : insertImageUrl,
  updatePersonId : updatePersonID,
  getdevicedetails : getDeviceCredentials
};