import {get, update} from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
import AWS from 'aws-sdk'
const sqs = new AWS.SQS();
async function pickToTranslate(event, context){
    const { orderId } = event.pathParameters;
    const user = event.requestContext.authorizer.jwt.claims.username;
    const user_result = await get(process.env.TRANSLATOR_TABLE, {email: user});
    let who, UpdateExpression, ExpressionAttributeValues = {}

    if(user_result.error){
        return sendResponse(501, {message: 'Something went wrong!'})
    }
    if(user_result.data.approved == 'false'){
        return sendResponse(405, {message: 'You have not been approved to carry out order actions yet!'});
    }

    const order_details = await get(process.env.ORDERS_TABLE, {id: orderId})

    if(order_details.error){
        return sendResponse(404, {message: order_details.error})
    }

    if(order_details.data.translator === user){
        return sendResponse(502, {message: "Cannot proofread what you translated!"})
    }

    if(order_details.data.translator === "null" && order_details.data.proofreader === "null"){
        who = "translator";
        UpdateExpression = 'set translator = :email, standing = :t';
        ExpressionAttributeValues[':t'] = 'translating'
    }else{
        who = "proofreader";
        UpdateExpression = 'set proofreader = :email, standing = :t';
        ExpressionAttributeValues[':t'] = 'proofreading';
    }
    ExpressionAttributeValues[':email'] = user;

    const params = {
        TableName: process.env.ORDERS_TABLE,
        Key: {id: orderId},
        UpdateExpression,
        ExpressionAttributeValues
    }

    const email_params = {
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'Picked Job',
            body: `You have being assigned as a ${who} for project with id ${orderId}. Goodluck!`,
            recipient: user
        })
    }

    
    await update(params);
    // send email

    try{
        await sqs.sendMessage(email_params).promise()
    }catch(err){
        console.error(err)
    }



    return sendResponse(201, {message: `${user} is the ${who} for the project with id: ${orderId}`})
}
    

export const handler = pickToTranslate