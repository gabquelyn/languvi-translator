import { update, get } from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
import AWS from 'aws-sdk'
import multipart from "lambda-multipart-parser";
const S3 = new AWS.S3()
async function submitTranslate(event, context) {
  const { orderId } = event.pathParameters;
  const user = event.requestContext.authorizer.jwt.claims.username

  const order_result = await get(process.env.ORDERS_TABLE, {id: orderId});
  if(order_result.error){
    return sendResponse(404, {message: `order with ${orderId} does not exist`})
  }

  if(order_result.data.translator !== user){
    return sendResponse(502, {message: 'You do not have a concern with this order!'})
  }

  const parsed_input = await multipart.parse(event);
  const filetype = parsed_input.files[0].contentType;
  const filename = parsed_input.files[0].filename;
  const filecontent = parsed_input.files[0].content;
  
  try{
    await S3.putObject({
        Bucket: process.env.TRANSLATOR_BUCKET,
        Key: `translatordocuments/${filename}`,
        Body: filecontent,
        ContentType: filetype
    }).promise()
  }catch(err){
    console.error(err)
    return sendResponse(502, {message: err.message})
  }
  const fileurl = `https://${process.env.TRANSLATOR_BUCKET}.s3.amazonaws.com/translatordocuments/${filename}`;

  const params = {
    TableName: process.env. ORDERS_TABLE,
    Key: {id: orderId},
    UpdateExpression: 'set #file = :translatorfile',
    ExpressionAttributeValues : {
        ':translatorfile' : fileurl
    },
    ExpressionAttributeNames: {
        '#file' : 'translator_file_url'
    }
  }
  const result = await update(params)
  if(result.error){
    return sendResponse(501, {message: result.error.message})
  }

  return sendResponse(200, {message: `${user} has subitted the translated file for the order with id: ${orderId}  `})
}
export const handler = submitTranslate;
