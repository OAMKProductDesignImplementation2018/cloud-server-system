
const axios = require('axios');

const axiosCustom = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey']         
    }
});

// For adding binary image to Face
const axiosCustomBinary = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey']         
    }
});

// Blob storage settings
var azureStorage = require('azure-storage');
const storageAccount = process.env[StorageAccount];
const storageAccessKey = process.env[StorageAccessKey];
const containerName = process.env[ContainerName];
var hostName = 'https://' + storageAccount + '.blob.core.windows.net';
var blobService = azureStorage.createBlobService(storageAccount, storageAccessKey);

// Set database configurations for connecting:
var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

var _currentData = {};
var config = {
    userName: process.env[DBusername],
    password: process.env[DBpassword],
    server: process.env[DBserver],
    options: {encrypt: true, database: process.env[DBname]}
};

function uploadImage(req) {

    // Receive the image:
    const contentLength = parseInt(req.headers['content-length']);
    const boundaryMarkerIndex = req.headers['content-type'].indexOf("=");
    const boundary = req.headers['content-type'].substring(boundaryMarkerIndex+1);
    const data = req.body;
    console.log("Image data: " + req);
    // remove boundary from the end
    // Add 2 for boundary prefix --, add 2 for last boundary postfix --, add 2*2 for linebreaks
    let testData = data.slice(0,contentLength - (boundary.length + 2 + 2 + 2 + 2)); 
    //  Content-Disposition: form-data; name="image"; filename="upload_test.png", Content-Type: image/png
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
    return finalImageData;
}

function saveImageToAzure(imgString, imgName) {
    // imgString = binarydata
    // imgName = userID.png 
    // Check if imgName already exists:
    let newImgName = imgName;
    blobService.getBlobProperties(
        containerName,
        imgName,
        function(err, properties, status) {
            if (status.isSuccessful) {
                // Blob exists
                newImgName += "0"; // Add something to imgName to make it a new blob
            } 
        });
    newImgName += ".png";
    blobService.createBlockBlobFromText(
        containerName,
        newImgName,
        imgString,
        function(err, result, response) {
            if(err){
                throw err;
            }
            console.log(["Uploaded image to " + containerName + " container on Azure."].join(''));
            //console.log(["URL: ", publicUrl].join(''));
        });
    //Return link to blob
    return blobService.getUrl(containerName, newImgName, null, hostName);
}

// Convert base64 to binary buffer:
/*var rawdata = req.body;
var matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
var type = matches[1];
var buffer = new Buffer(matches[2], 'base64');

blobsrv.createBlockBlobFromText('mycontainer','testimage.jpg', buffer, {contentType:type}, function(error, result, response) {
        if (error) {
            console.log(error);
        }else{
         console.log(result)
        }
    });*/

    /*async function createPersonGroup(personGroupId)
    {
        let returnData = {
            status: null,
            data: null
        };
    
        try {
            const response = await axiosCustom.put(`/persongroups/${personGroupId}`,
                {
                    name: "Persons"
                });
    
            returnData.status = response.status;
            returnData.data = response.data;
        }
        catch(error)
        {
            returnData.status = error.response.status;
            returnData.data = error.response.data;
        }
        return returnData;
    }*/
    
async function createPerson(personGroupId, personData)
{
    console.log("personGroupID", personGroupId);

    let returnData = {
        status: null,
        data: null
    };
    try {
        const personCreateResponse = await axiosCustom.post(`/persongroups/${personGroupId}/persons/`, personData)
        returnData.status = personCreateResponse.status;
        returnData.data = personCreateResponse.data;
    }
    catch(error)
    {
        returnData.status = error.response.status;
        returnData.data = error.response.data;
    }
    return returnData;
    console.log("Create person:", returndata);

}

async function addFaceToPerson(personGroupId, personId, imageData)
{
    console.log("Add face:", imageData);

    let returnData = {
        status: null,
        data: null
    };
    try {
        // https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}/persons/{personId}/persistedFaces[?userData][&targetFace]
        /*const response = await axiosCustomBinary.post(`/persongroups/${personGroupId}/persons/${personId}/persistedFaces`,
            {
                imageData // sending binary
            });*/
        const response = await axiosCustom.post(`/persongroups/${personGroupId}/persons/${personId}/persistedFaces`,
        {
            "url" : imageData // sending url to img
        });
        returnData.status = response.status;
        returnData.data = response.data;
    }
    catch(error)
    {
        returnData.status = error.response.status;
        returnData.data = error.response.data;
    }
    return returnData;
}

async function trainPersonGroup(personGroupId)
{
    let returnData = {
        status: null,
        data: null
    };
    try {        
        const response = await axiosCustom.post(`/persongroups/${personGroupId}/train`);
        returnData.status = response.status;
        returnData.data = response.data;
    }
    catch(error)
    {
        returnData.status = error.response.status;
        returnData.data = error.response.data;
    }
    return returnData;
}

async function dbQuery(query) {

    // Connect to database
    var connection = new Connection(config);
    connection.on('connect', function(err) {
        console.log("Connected to database");

    // Make a request to database
    request = new Request(query, function(err) {
    if (err) {
        console.log(err);}
    });

    /*request.on('row', function(columns) {
        // prints ID and name to log
        _currentData.ID = columns[0].value;
        _currentData.FirstName = columns[1].value;
        _currentData.LastName = columns[2].value;
        _currentData.GroupID = columns[3].value;
        console.log(_currentData);
    });*/

    request.on('requestCompleted', function () {
        console.log('Request completed.');
    });
    connection.execSql(request);
});
}


module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // TODO: get user's id from mobile app request
    let userIdString = "2"; // testing with id 1 or 2

    let imgData = uploadImage(req); // Get image from request
    let imgUrl = saveImageToAzure(imgData, userIdString); // Upload image to Azure Blob Storage and get url

    const personGroupId = '1'; // Set the GroupID
    let personIdString = "";

    // Create person group
    // https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}

    // First delete possible existing person group
    /*const deletePersonGroupResponse = await deletePersonGroup(personGroupId);
    context.log("Person group delete status " + deletePersonGroupResponse.status);
    context.log("Person group delete data " + deletePersonGroupResponse.data);*/
    
    /*const createPersonGroupResponse = await createPersonGroup(personGroupId);
    context.log("Person group create status " + createPersonGroupResponse.status);
    context.log("Person group create data " + createPersonGroupResponse.data);*/

    // * Create new Person *
    const personCreateResponse = await createPerson(personGroupId, { name: 'Max Tester'});
    context.log("Person create status " + personCreateResponse.status);
    context.log("Person create data " + personCreateResponse.data);

    //  * Get Persons id *
    personIdString = personCreateResponse.data.personId;
    context.log("personid:", personIdString);
    // Set personId and imgUrl to database, using user ID:
    dbQuery("UPDATE dbo.Persons SET PersonID = '" + personIdString + 
            "', ImageURL = '" + imgUrl + "' WHERE ID = '" + userIdString + "'");

    // * Add face to Person *
    //const filePath = "https://cdn.pixabay.com/photo/2018/10/18/19/02/woman-3757184_960_720.jpg";
    //const filePath = process.env['Path'] + imagename + process.env['FileStorageSASKey'];
    const addFaceResponse = await addFaceToPerson(personGroupId, personIdString, imgUrl);
    //const addFaceResponse = await addFaceToPerson(personGroupId, personCreateResponse.data.personId, finalImageData);
    context.log(`Person Face add status ${addFaceResponse.status}`);
    context.log(`Person Face add data ${addFaceResponse.data}`);

    // * Train Person Group *
    const trainResponse = await trainPersonGroup(personGroupId);
    context.log("Train status " + trainResponse.status);
    context.log("Train data " + trainResponse.data);
    
    if(trainResponse.status == 202)
    {
        trainResponse.data = { status: "Training completed "};
    }

    context.res = {
        status: trainResponse.status,
        body: trainResponse.data
    };
    

    // Detect face in Image
    // https://northeurope.api.cognitive.microsoft.com/face/v1.0/detect[?returnFaceId][&returnFaceLandmarks][&returnFaceAttributes]

    // User detected faceId to identify person in Image
    // https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395239

};
