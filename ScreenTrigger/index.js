const axios = require('axios');

const axiosCustom = axios.create({
    baseURL: 'https://northeurope.api.cognitive.microsoft.com/face/v1.0',    
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env['FaceApiAccessKey']         
    }
  });

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    
    const contentLength = parseInt(req.headers['content-length']);

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
        //TODO: kun tunnistetaan naama -> tunnistetaan -> sitten haetaan datat jotka palautetaan
        //ATM palauttaa joka tilanteessa kun ei tule erroria vakio Json-objektin
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: getJson(),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
    catch(error)
    {
        returnData.status = error.response.status;
        returnData.data = error.response.data;
        context.res = {
            body: returnData
        }
    }
};

function getJson(/*userid*/)
{
    //TODO:find user data by id passed as parameter
    //TODO:get user preferanses from db (function1) and get data from selected API's(function2)
    return {
        "firstName" : "First",
        "lastName" : "Last",
        "groupID" : "GroupID",
        "schedule" : [
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Mon",
                "start" : "8:45",
                "end" : "10:15"
            },
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Tue",
                "start" : "17:30",
                "end" : "19:00"
            },
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Tue",
                "start" : "19:15",
                "end" : "20:45"
            },
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Wed",
                "start" : "12:00",
                "end" : "14:00"
            },
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Thu",
                "start" : "8:15",
                "end" : "10:00"
            },
            {
                "name" : "Course Name",
                "teacher" : "Teacher Name",
                "room" : "Room Code",
                "day" : "Fri",
                "start" : "19:15",
                "end" : "20:45"
            }
        ],
        "foodMenu" : [
            {
                "type" : "Lunch",
                "menu items" : [
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