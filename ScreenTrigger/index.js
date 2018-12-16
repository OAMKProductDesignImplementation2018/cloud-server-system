const axios = require('axios');
const dbconnector = require('../Shared/DatabaseFuncs');
const Auth = require('../Shared/auth');

const axiosCustom = axios.create({
  baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey2']
  }
});

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');
  const token = req.headers['apikey'];
  const deviceid = req.headers['deviceid'];
  const organizationid = req.headers['organizationid'];
  var credentialcheck = false;
  context.log(deviceid);
  context.log(token);
  context.log(organizationid);
  var devicecreds = {};
  try { devicecreds = await dbconnector.getdevicedetails(context, deviceid);}
  catch(err){context.log(err);}
  context.log(devicecreds);

  if (devicecreds != undefined && token != undefined && deviceid != undefined && organizationid != undefined) {
    try {
      const creds = Auth.ver(token);
      context.log(creds);
      credentialcheck = Boolean(creds.org == organizationid && creds.dev == deviceid && creds.org == devicecreds[0].organizationid && creds.dev == devicecreds[0].deviceid);
    } catch(err) {context.res = nothingFound(err);}
  }
  if (credentialcheck){
    const contentLength = parseInt(req.headers['content-length']);
    if(contentLength){
      context.log(contentLength);
      // Get the multipart boundary marker, see multipart details https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
      const boundaryMarkerIndex = req.headers['content-type'].indexOf("=");
      const boundary = req.headers['content-type'].substring(boundaryMarkerIndex+1);
      const data = req.body;

      // remove boundary from the end
      let testData = data.slice(0,contentLength - (boundary.length + 2 + 2 + 2 + 2)); // Add 2 for boundary prefix --, add 2 for last boundary postfix --, add 2*2 for linebreaks

      // Calculate the starting location of the image data in the body, the begninning has multipart header data such as seen below in example:
      //  ----------------------------495851880813268952814107
      //  Content-Disposition: form-data; name="image"; filename="upload_test.png"
      //  Content-Type: image/png
      //
      // *Data starts here*
      let lineBreakCounter = 0;
      let dataStartIndex = 0;
      for(let i = 0; i < testData.length; i++)
      {
        if(testData[i] == 13 && testData[i+1] == 10)
        {
          lineBreakCounter++;
          if(lineBreakCounter == 4)
          {
            dataStartIndex = i+2;
            break;
          }
        }
      }

      // remove the multipart header
      const finalImageData = testData.slice(dataStartIndex);
      const returnData = { status: null,
        data: null };

        // Perform Azure Face API Detect request
        try {
          const response = await axiosCustom.post(`/detect`, finalImageData, { headers: { 'Content-Type': 'application/octet-stream' }});
          returnData.status = response.status;
          returnData.data = response.data;
          context.log(returnData);
          //check if any faces were detected
          if (typeof returnData.data !== 'undefined' && returnData.data.length > 0) {
            var detectedFaceIds = new Array();
            detectedFaceIds.push(returnData.data[0].faceId);
            context.log(detectedFaceIds);
            //try to identify persons
            try{
              const identifiedFaceId = await identifyDetectedFace(detectedFaceIds);
              context.log("Tunnistustulos: ");
              context.log(identifiedFaceId);
              if (identifiedFaceId != undefined) {
                //cross-referance identified id with db
                try{
                  const identifyresult = await dbconnector.findperson(context, identifiedFaceId.personId.toString());
                  context.log("query tulos: ");
                  context.log(identifyresult);
                  const dietary = await dbconnector.querydb(context, "SELECT * FROM dbo.Dietary WHERE UserID =" + identifyresult[0].ID);
                  context.log(dietary);
                  const restaurant = await dbconnector.querydb(context, "SELECT * FROM dbo.Restaurants WHERE ID =" + identifyresult[0].RestaurantID);
                  context.log(restaurant);
                  if(identifyresult != undefined){
                    context.res = {
                      // status: 200, /* Defaults to 200 */
                      body: getJson(identifyresult, dietary, restaurant),
                      headers: {'Content-Type': 'application/json'}};
                    }
                  }catch(err){context.log(err);}
                } else {context.res = nothingFound("No known users");}
              }catch(err){context.log(err);}
            } else {context.res = nothingFound("No face detected");}}
            catch(error)
            {
              context.log(error);
              context.res = nothingFound("Error");
            }
          } else {context.res = nothingFound("no content");}
        } else {
          if (token === 'null' && devicecreds[0] !== undefined)
          {
            var date = (new Date()).toISOString().slice(0,10);
            const organization = await dbconnector.querydb(context, "SELECT * FROM dbo.Organization WHERE ID =" + devicecreds[0].organizationid);
            const restaurant = await dbconnector.querydb(context, "SELECT * FROM dbo.Restaurants WHERE ID =" + organization[0].restaurantid);
            const newtoken = Auth.auth({'org' : organizationid, 'dev' : deviceid, 'token' :token});
            context.log(restaurant);
            context.log(newtoken);
            if (organization[0].id == organizationid && devicecreds[0].deviceid == deviceid) {
              context.res = {body: {"token" : newtoken,
              "organization" : organization[0].name,
              "foodMenu" : [
                {
                  "name" : restaurant[0].name,
                  "url" : "https://www.amica.fi/api/restaurant/menu/day?date=" + date +"&language=fi&restaurantPageId="+restaurant[0].restaurantId,
                }]},
                headers: {'Content-Type': 'application/json'}};
              } else {context.res = nothingFound("Auhentication failed");}
            } else {context.res = nothingFound("Auhentication failed");}
          }};

          async function identifyDetectedFace(faceIds)
          {
            const jsonToPost = {
              "personGroupId": '1',
              "faceIds": faceIds,
              "maxNumOfCandidatesReturned": 1,
              "confidenceThreshold": 0.7
            }
            const returnData = { status: null,
              data: null };
              try{
                const response = await axiosCustom.post(`/identify`, jsonToPost, { headers: { 'Content-Type': 'application/json' }})
                .catch(err=>{return err.response;});
                returnData.status = response.status;
                returnData.data = response.data;
                return returnData.data[0].candidates[0];
              }
              catch (error){
                return error;
              }
            }

            function nothingFound(message)
            {
              return {body: {"error" : message},
              headers: {'Content-Type': 'application/json'}};
            }

            function getJson(identifyresult, diet, restaurant)
            {
              var date = (new Date()).toISOString().slice(0,10);
              console.log(date);
              return {
                "firstname" : identifyresult[0].FirstName,
                "lastname" : identifyresult[0].LastName,
                "schedule" : "https://oiva.oamk.fi/_lukkarikone/kalenteri/json/varaukset.php?ryhma=" + identifyresult[0].GroupID,
                "foodMenu" : [
                  {
                    "name" : restaurant[0].name,
                    "url" : "https://www.amica.fi/api/restaurant/menu/day?date=" + date +"&language=fi&restaurantPageId="+restaurant[0].restaurantId,
                    "filters" : [
                      {
                        "G" : diet[0].G,
                        "L" : diet[0].L,
                        "VL" : diet[0].VL,
                        "M" : diet[0].M,
                        "VH" : diet[0].VH,
                        "VEG" : diet[0].VEG,
                        "VS" : diet[0].VS,
                        "A" : diet[0].A
                      }
                    ]
                  }
                ],
                "notes" : [
                  {
                    "title" : "Title",
                    "contents" : "Contents",
                    "day" : "Mon",
                    "start" : "12:00",
                    "end" : "16:00"
                  },
                  {
                    "title" : "Another Title",
                    "contents" : "Other Contents",
                    "day" : "Fri",
                    "start" : null,
                    "end" : null
                  }
                ]
              };
            }
