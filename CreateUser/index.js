// Set database configurations for connecting:
const dbconnector = require('../Shared/DatabaseFuncs.js');
const crypt = require('../Shared/Crypt.js');


module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    json = req.body;
    context.log(json);

    let fn = json['firstname']; //FirstName
    let ln = json['lastname']; // LastName
    let email = json['email']; // Email
    //let org = ""; // Organisation
    let pw = json['password']; // Password

    if (fn && ln && email && pw) {

        var splitEmail = email.split('@');
        context.log(splitEmail[1]);
        try {
            var checkEmail = await dbconnector.checkEmail(context, splitEmail[1]);
            context.log(checkEmail);

            if (checkEmail[0].RESULT){

                try {
                    var duplicate = await dbconnector.duplicateEmail(context, email);
                    context.log(duplicate);

                    if(!duplicate[0].RESULT){
                        try {
                            var saltHash = crypt.hashP(pw);
                            hashPw = saltHash[1];
                            hashSalt = saltHash[0];
                            var query = await dbconnector.newuser(context, fn, ln, email, hashPw, hashSalt);
                            context.log(query);

                            context.res = {
                                status: 200,
                                body: { "result" : "true",
                                        "message" : "Register succeeded." }
                            };
                        }
                        catch(err){
                            context.log(err);
                        }
                    }
                    else {
                        context.res = {
                            status: 400,
                            body: { "result" : "false",
                                    "message" : "This email already has an account." }
                        };
                    }
                }
                catch(err){
                    context.res = {
                        status: 400,
                        body: { "result" : "false",
                                "message" : err }
                    };
                }
            }
            else {
                
                context.res = {
                    status: 400,
                    body: { "result" : "false",
                            "message"  : "Please register with your organisation email."}
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
            body: { "result" : "Please insert all the required values." }
        };
    }
};