import AWS from "aws-sdk";
import sendResponse from "../../lib/sendResponse";
import axios from 'axios'
import FormData from "form-data";
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

async function useCat(event, context) {
  const { filekey, orderId, source, target } = JSON.parse(event.body);
  
  const order_details = await dynamodb.get({
    TableName: process.env.ORDERS_TABLE,
    Key: {id: orderId},
  }).promise();

  if(!order_details.Item){
    return sendResponse(404, {message: "Order doesn't exist"})
  }

  if(order_details.Item.catTools === "false"){
    return sendResponse(502, {message: "CatTools not enabled for this order!"})
  }
  
  // get the file from s3 bucket
  const params = {
    Bucket: process.env.CLIENT_BUCKET_NAME,
    Key: `clientdocuments/${filekey}`,
  };

  try {
    const catData = new FormData();
    const s3Response = await s3.getObject(params).promise();
    const fileData = s3Response.Body;

    // append the data for the file
    catData.append("source_lang", source);
    catData.append("target_lang", target);
    catData.append("project_name", `translation_${orderId}`);
    catData.append("file", fileData, filekey);

    // append headers
    const headers = {
      "x-matecat-key": `${process.env.API_KEY}-${process.env.SECRET_KEY}`,
    };

    // handle sending
    const response = await axios.post(
      "https://www.matecat.com/api/v1/new",
      catData,
      {
        headers: {
          ...catData.getHeaders(),
          ...headers,
        },
      }
    );

    const responseData = response.data;
    const new_mate_object = {...order_details.Item.mate_data, [filekey] : responseData}

    const update_params = {
      TableName: process.env.ORDERS_TABLE,
      Key: { id: orderId },
      UpdateExpression : 'SET mate_data = :obj',
      ExpressionAttributeValues : {
        ':obj' : new_mate_object
      }
    };

    await dynamodb.update(update_params).promise()
    return sendResponse(200, { message: responseData });
  } catch (err) {
    console.error(err)
    return sendResponse(501, { erorr: err });
  }
}

export const handler = useCat;
