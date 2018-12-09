// Set database configurations for connecting:
const dbconnector = require('../Shared/DatabaseFuncs.js');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    json = req.body;
    context.log(json);

    var id = json.user_id;
    let firstname = json['first_name'];
    let lastname = json['last_name']; 
    let groupid = json['groupid']; 
    let gender = json['gender']; 
    let restaurantid = json['restaurant_id'];
    let g = json['g'];
    let l = json['l'];
    let vl = json['vl'];
    let m = json['m'];
    let vh = json['vh'];
    let veg = json['veg'];
    let vs = json['vs'];
    let a = json['a'];

    try {
        var query = await dbconnector.update(context, id, firstname, lastname, groupid, gender, restaurantid);
        var dietQuery = await dbconnector.updatediet(context, id, g, l, vl, m, vh, veg, vs, a);
        context.log(id);
        context.log(query);
        context.log(dietQuery);
        context.res = {
            status: 200,
            body: { "result" : "true",
                    "message" : "Update succeeded." }
        };
    }
    catch(err){
        context.res = {
            status: 400,
            body: { "result" : "false",
                    "message" : err }
        };
    }
}
