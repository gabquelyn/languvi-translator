import token from "../../lib/accessToken";
import AWS from 'aws-sdk'
import { update } from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
const sqs = new AWS.SQS();
async function getAuthToken(event, context){
    const {email} = event.pathParameters
    const accessToken = token(5);
    const tableName = process.env.TRANSLATOR_TABLE
    const params  = {
        TableName: tableName,
        Key: {email},
        UpdateExpression: 'set #token = :t',
        ExpressionAttributeValues: {
            ':t' : accessToken
        },
        ExpressionAttributeNames: {
            '#token' : 'authToken'
        }
    }

    const email_params = {
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'Verify your email address',
            body: `Your email verification code is ${accessToken}`,
            recipient: email
        })
    }

    const result = await update(params);
    if(result.error){
        return sendResponse(501, {message: result.error.message})
    }


    try{
        const output = await sqs.sendMessage(email_params).promise()
        console.log(output);
    }catch(err){
        console.error(err)
        return sendResponse(501, {messgae: err.message});
    }

    setTimeout(async() => {
        const params  = {
            TableName: tableName,
            Key: {email},
            UpdateExpression: 'set #token = :t',
            ExpressionAttributeValues: {
                ':t' : "null"
            },
            ExpressionAttributeNames: {
                '#token' : 'authToken'
            }
        }
       
        const result = await update(params)
        if(result.error){
            console.log(error)
        }
        
    }, 2 * 60 * 60 * 1000);
}

export const handler = getAuthToken;