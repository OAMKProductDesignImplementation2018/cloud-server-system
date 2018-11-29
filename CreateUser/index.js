// Set database configurations for connecting:
const dbconnector = require('../Shared/DatabaseFuncs.js');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    json = req.body;
    context.log(json);

    let fn = json['firstname']; //FirstName
    let ln = json['lastname']; // LastName
    let email = json['email']; // Email
    //let org = ""; // Organisation
    let pw = json['password']; // Password
    //pw = pw + process.env.Salt; // add salt to password
    //context.log(pw);

    if (fn && ln && email && pw) {
        // Set personId and imgUrl to database, using user ID:

        try {
            var query = await dbconnector.querydb(context, 
                "INSERT INTO dbo.Persons (FirstName, LastName, Email, Pword) VALUES ('"
                + fn +"','" + ln + "','" + email + "','" + pw + "')");

                // var query = await dbconnector.querydb(context, 
                //"INSERT INTO dbo.Persons (FirstName, LastName, Email, Psword) VALUES ("
                //+ fn +"," + ln + "," + email + "," + "HASHBYTES('SHA2_512'," + pw + ")");

            var querySelect = await dbconnector.querydb(context, 
                "SELECT ID FROM dbo.Persons WHERE Email = '" + email + "'");
            var userid = querySelect[0].ID;
        
            context.log(userid);
            context.res = {
                status: 200,
                body: {"id" : userid}
            };
        }
        catch(err){
            context.log(err);
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};