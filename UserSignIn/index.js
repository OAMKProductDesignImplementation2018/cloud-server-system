// Set database configurations for connecting:
const dbconnector = require('../Shared/DatabaseFuncs.js');
const crypt = require('../Shared/Crypt.js');

function parsePerson(data){

    return {
        "id" : data[0].ID,
        "firstname" : data[0].FirstName,
        "lastname" : data[0].LastName,
        "groupid" : data[0].GroupID,
        "gender" : data[0].Gender,
        "imageurl" : data[0].ImageURL,
        "gender" : data[0].Gender,
        "organisation" : data[0].Organisation,
        "email" : data[0].Email,
        "restaurantid" : data[0].RestaurantID
    }
}

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

        try {
            var querySelect = await dbconnector.login(context, email);
            context.log(querySelect);

            if(querySelect){
                var password = querySelect[0].Pword;
                var salt = querySelect[0].Salt;

                var loginSuccess = crypt.checkP(pw, password, salt);
                if(loginSuccess){
                    var personData = await dbconnector.findAllData(context, email);
                    var returnedData = parsePerson(personData);

                    context.res = {
                        status: 200,
                        body: { "login" : "Success",
                                "data" : returnedData }
                    };
                }
                else {
                    context.res = {
                        status: 400,
                        body: { "login" : "Fail" }
                    };
                }
            }
        }
        catch(err){
            context.log(err);
        }
    }
    else {
        context.res = {
            status: 400,
            body: "Please insert email and password."
        };
    }
};