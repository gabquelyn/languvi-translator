import { update, get } from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
import AWS from 'aws-sdk'
import multipart from "lambda-multipart-parser";
const S3 = new AWS.S3()
async function submit(event, context) {
  const user = event.requestContext.authorizer.jwt.claims.username
  const result = await multipart.parse(event);
  const orderId  = result.orderId;

  const order_result = await get(process.env.ORDERS_TABLE, {id: orderId});
  if(order_result.error){
    return sendResponse(404, {message: `order with ${orderId} does not exist`})
  }

  if(order_result.data.standing !== "translating" || order_result.data.standing !== "proofreading" || order_result.data.standing !== "revision"){
    return sendResponse(405, {message: "Response file already submitted and either in revision or proofreading!"})
  }
  if(order_result.data.translator === user || order_result.data.proofreader === user){
    const newfilekeys = [];
  for (const file of result.files) {
    const fileName = file.filename;
    const fileContent = file.content;
    const fileType = file.contentType;

    // Set up S3 upload parameters
    const uploadParams = {
      Bucket: process.env.TRANSLATOR_BUCKET,
      Key: `responsefiles/${fileName}`,
      Body: fileContent,
      ContentType: fileType,
    };

    try {
      await S3.upload(uploadParams).promise();
    } catch (err) {
      console.error(err);
      return sendResponse(502, { message: err.message });
    }
    newfilekeys.push(fileName);
  }

  let UpdateExpression, ExpressionAttributeValues = {
    ":filearray" : [...newfilekeys]
  };
  
  if(order_result.data.translator == user){
    UpdateExpression = 'SET translator_file_url  = :filearray'
    ExpressionAttributeValues[':do'] = "unassigned proofreading";

    if(order_result.data.mandate_proofread === "true"){
      UpdateExpression += ", standing = :do";
      ExpressionAttributeValues[':do'] = "unassigned proofreading";
    }else{
      UpdateExpression += ", standing = :d";
      ExpressionAttributeValues[':d'] = "revision";
    }
  }

  if(order_result.data.proofreader == user){
    UpdateExpression = 'SET proofreader_file_url = :filearray'
    UpdateExpression += ", standing = :do";
    ExpressionAttributeValues[':do'] = "revision";
  }


  const params = {
    TableName: process.env.ORDERS_TABLE,
    Key: {id: orderId},
    UpdateExpression,
    ExpressionAttributeValues,
  }

  const response = await update(params)
  if(result.error){
    return sendResponse(501, {message: response.error.message})
  }

  return sendResponse(201, {message: "submitted successfully!"})
  }
  

 
  return sendResponse(503, {message: `${user} is not related to order with id of ${orderId} `})
}
export const handler = submit;
