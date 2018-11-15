
const axios = require('axios');

const axiosCustom = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey']         
    }
  });

var Connection = require('tedious').Connection;
var Request = require('tedious').Request
var TYPES = require('tedious').TYPES;

var _currentData = {};
var config = {
    userName: process.env['DBusername'],
    password: process.env['DBpassword'],
    server: process.env['DBserver'],
    options: {encrypt: true, database: process.env['DBname']}
};

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
        let returnData = {
            status: null,
            data: null
        };
        try {
            // https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}/persons/{personId}/persistedFaces[?userData][&targetFace]
            const response = await axiosCustom.post(`/persongroups/${personGroupId}/persons/${personId}/persistedFaces`,
                {
                    "url": imageData
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
        console.log("Add face:", returndata);

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
        console.log("Train:", returndata);

    }

    async function getData(query) {

        var connection = new Connection(config);
        console.log("Connect to database");
        connection.on('connect', function(err) {
            console.log("Connected to database");

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
        context.log("Start");

        // Example image
        // https://faceregonizerstorage.file.core.windows.net/facetestapp07112018-content-2a29/faceTestImages/Family1-Dad1.jpg
    
    
        // https://westus.api.cognitive.microsoft.com/face/v1.0/detect[?returnFaceId][&returnFaceLandmarks][&returnFaceAttributes]</Subscription>&subscription-key=<Subscription key>
        // https://northeurope.api.cognitive.microsoft.com/face/v1.0
    
        // Create person group
        // https://northeurope.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}
    
    
        const personGroupId = '1';
        let personIdString = "";
    
        // First delete possible existing person group
        /*const deletePersonGroupResponse = await deletePersonGroup(personGroupId);
        context.log("Person group delete status " + deletePersonGroupResponse.status);
        context.log("Person group delete data " + deletePersonGroupResponse.data);*/
       
        /*const createPersonGroupResponse = await createPersonGroup(personGroupId);
        context.log("Person group create status " + createPersonGroupResponse.status);
        context.log("Person group create data " + createPersonGroupResponse.data);*/
    
        const personCreateResponse = await createPerson(personGroupId, { name: 'Max Tester'});
        context.log("Person create status " + personCreateResponse.status);
        context.log("Person create data " + personCreateResponse.data);
        personIdString = personCreateResponse.data.personId;
        context.log("personid:", personIdString);
        getData("UPDATE dbo.Persons SET PersonID = '" + personIdString + "' WHERE ID = 1");
        
        const faceData ={ 
            person1: [
                'Family1-Dad1.jpg',
                'Family1-Dad2.jpg',
                'Family1-Dad3.jpg',
            ],
            person2: [
                'Family3-Lady1.jpg',
                'Family3-Lady2.jpg',
                'Family3-Lady4.jpg',
            ],
            person3: [
                'Family3-Man1.jpg',
                'Family3-Man2.jpg',
                'Family3-Man3.jpg',
            ]
        };
    
        for(let i = 0; i < faceData.person1.length; i++)
        {
            const filePath = "https://cdn.pixabay.com/photo/2018/10/18/19/02/woman-3757184_960_720.jpg";
            //const filePath = process.env['TestImagePath'] + faceData.person1[i] + process.env['FileStorageSASKey'];
            const addFaceResponse = await addFaceToPerson(personGroupId, personCreateResponse.data.personId, filePath);
            context.log(`Person ${i} Face add status ${addFaceResponse.status}`);
            context.log(`Person  ${i} Face add data ${addFaceResponse.data}`);
        }
    
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
