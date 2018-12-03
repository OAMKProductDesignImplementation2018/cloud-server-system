const axios = require('axios');
const dbconnector = require('../Shared/DatabaseFuncs');

const axiosCustom = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey2']         
    }
  });

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');
//if (req.headers['device-id'] == process.env['device-key'])
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
                    context.log("SELECT FirstName, LastName FROM dbo.Persons where PersonID = '" + identifiedFaceId.personId.toString() + "'");
                    const identifyresult = await dbconnector.querydb(context, "SELECT FirstName, LastName, GroupID FROM dbo.Persons where PersonID = '" + identifiedFaceId.personId.toString() + "'");
                    context.log("query tulos: ");
                    context.log(identifyresult);
                    if(identifyresult != undefined){
                      context.res = {
                        // status: 200, /* Defaults to 200 */
                        body: getJson(identifyresult),
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
};

async function identifyDetectedFace(faceIds)
{
    const jsonToPost = {
        "personGroupId": '1',
        "faceIds": faceIds,
        "maxNumOfCandidatesReturned": 1,
        "confidenceThreshold": 0.8
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
    return {// status: 200, /* Defaults to 200 */
            body: {"error" : message},
            headers: {'Content-Type': 'application/json'}};
}

function getJson(identifyresult)
{
    //TODO:find user data by id passed as parameter
    //TODO:get user preferanses from db (function1) and get data from selected API's(function2)
    return {
            "firstname" : identifyresult[0].FirstName,
            "lastname" : identifyresult[0].LastName,
            "schedule" : "https://oiva.oamk.fi/_lukkarikone/kalenteri/json/varaukset.php?ryhma=" + identifyresult[0].GroupID,
        "foodMenu" : [
            {
                "type" : "Lunch",
                "menuItems" : [
                    {
                        "name" : "Food Name"
                    }
                ]
            },
            {
                "type" : "Lunch",
                "menuItems" : [
                    {
                        "name" : "Food Name"
                    },
                    {
                        "name" : "Another Food Name"
                    },
                    {
                        "name" : "Yet Another Food Name"
                    }
                ]
            },
            {
                "type" : "Vegetable Lunch",
                "menuItems" : [
                    {
                        "name" : "Food Name"
                    },
                    {
                        "name" : "Another Food Name"
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