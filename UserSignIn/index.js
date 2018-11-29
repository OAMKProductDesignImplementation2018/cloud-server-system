// Set database configurations for connecting:
const dbconnector = require('../Shared/DatabaseFuncs.js');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    json = req.body;
    context.log(json);

    let email = json['email']; // Email
    //let org = ""; // Organisation
    let pw = json['password']; // Password
    //pw = pw + process.env.Salt; // add salt to password
    //context.log(pw);

    context.log(email);
    context.log(pw);

    if (email && pw) {
        // Set personId and imgUrl to database, using user ID:

        try {
            var querySelect = await dbconnector.querydb(context, 
                "SELECT * FROM dbo.Persons WHERE Email = '" + email +
                 "' AND Pword = '" + pw + "'");
            context.log(querySelect);

            if(querySelect){
                var userData = querySelect[0];
            
                context.log(userData);
                context.res = {
                    status: 200,
                    body: { userData }
                };
            }
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