// https://facedatabasetest.azurewebsites.net/api/MobileTrigger
const axios = require('axios');

const axiosCustom = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env["FaceApiAccessKey"]         
    }
});

// Blob storage settings
var azureStorage = require('azure-storage');
const storageAccount = process.env.StorageAccount;
const storageAccessKey = process.env.StorageAccessKey;
const containerName = process.env.ContainerName;
var hostName = 'https://' + storageAccount + '.blob.core.windows.net';
var blobService = azureStorage.createBlobService(storageAccount, storageAccessKey);

const dbconnector = require('../Shared/DatabaseFuncs.js');

function uploadImage(req) {

    // Receive the image:
    const contentLength = parseInt(req.headers['content-length']);
    const boundaryMarkerIndex = req.headers['content-type'].indexOf("=");
    const boundary = req.headers['content-type'].substring(boundaryMarkerIndex+1);
    const data = req.body;
    //console.log(req);
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
    //console.log(finalImageData);
    return finalImageData;
}

function saveImageToAzure(imageData, id) {
    // Create random name for image
    //const shortid = require('shortid');
    const imgName = id;
    newImgName = imgName + ".jpg";
    console.log("image name: " + newImgName);

    // Create Blob
    blobService.createBlockBlobFromText(
        containerName,
        newImgName,
        imageData,
        function(err, result, response) {
            if(err){
                throw err;
            }
            console.log(["Uploaded image to " + containerName + " container on Azure."].join(''));
        });

    //Return link to blob we just created
    return blobService.getUrl(containerName, newImgName, null, hostName);
}

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

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let userId = req.headers.user_id;    // get user's id from request
    context.log(userId);
    context.log(req.headers);

    let imgData = uploadImage(req); // Get image from request
    let imgUrl = saveImageToAzure(imgData, userId);   // Upload image to Azure Blob Storage and get url

    const personGroupId = '1'; // Set the GroupID

    // Create person group
    // https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}

    // First delete possible existing person group
    /*const deletePersonGroupResponse = await deletePersonGroup(personGroupId);
    context.log("Person group delete status " + deletePersonGroupResponse.status);
    context.log("Person group delete data " + deletePersonGroupResponse.data);*/
    
    /*const createPersonGroupResponse = await createPersonGroup(personGroupId);
    context.log("Person group create status " + createPersonGroupResponse.status);
    context.log("Person group create data " + createPersonGroupResponse.data);*/

    var personIdString = null;

    // Find PersonID from database, if it doesn't exists: create new Face API Person
    try {
        var findPersonQuery = await dbconnector.personIdfromId(context, userId);
        context.log(findPersonQuery);
        personIdString = findPersonQuery[0].PersonID;
        context.log(personIdString);
    }
    catch(err){
        context.log(err);
    }

    if (personIdString === null) {
        // * Create new Person *
        const personCreateResponse = await createPerson(personGroupId, { name: userId });
        context.log("Person create status ", personCreateResponse.status);
        context.log("Person create data ", personCreateResponse.data);

        //  * Get Persons id *
        personIdString = personCreateResponse.data.personId;
        context.log("personid:", personIdString);
        try {
        // Set personId and imgUrl to database
        var insertImage = await dbconnector.insertImageUrl(context, imgUrl, userId);
        var updatePersonID = await dbconnector.updatePersonId(context, userId, personIdString);

        }
        catch(err){
            context.log(err);
        }
    }


    // * Add face to Person *
    //const filePath = "https://cdn.pixabay.com/photo/2018/10/18/19/02/woman-3757184_960_720.jpg";
    //const filePath = process.env['Path'] + imagename + process.env['FileStorageSASKey'];
    const addFaceResponse = await addFaceToPerson(personGroupId, personIdString, imgUrl);
    //const addFaceResponse = await addFaceToPerson(personGroupId, personCreateResponse.data.personId, finalImageData);
    context.log(`Person Face add status ${addFaceResponse.status}`);
    context.log(`Person Face add data ${addFaceResponse.data}`);

    // * Train Person Group *
    const trainResponse = await trainPersonGroup(personGroupId);
    context.log("Train status ", trainResponse.status);
    context.log("Train data ", trainResponse.data);
    
    if(trainResponse.status == 202)
    {
        trainResponse.data = { status: "Training completed "};
    }

    context.res = {
        body: { "result" : "OK",
                "header" : req.headers
        }
    };
    

    // Detect face in Image
    // https://northeurope.api.cognitive.microsoft.com/face/v1.0/detect[?returnFaceId][&returnFaceLandmarks][&returnFaceAttributes]

    // User detected faceId to identify person in Image
    // https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395239

};
