import AWS from "aws-sdk";
import { get } from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
const cognito = new AWS.CognitoIdentityServiceProvider();
async function confirm_email(event, context){
    const {email} = event.pathParameters
    const {token} = JSON.parse(event.body);

    const result = await get(process.env.TRANSLATOR_TABLE, {email})
    if(result.error){
        return sendResponse(501, {message: result.error.message})
    }

    if(result.data.authToken == token){
        const params = {
            UserPoolId: process.env.USER_POOL_ID,
            Username: email,
            UserAttributes: [
                {
                    Name: 'email_verified',
                    Value: 'true'
                }
            ]
        }

        const _params = {
            Password: result.data.password,
            UserPoolId: process.env.USER_POOL_ID,
            Username: email,
            Permanent: true
        }

        try{
           await cognito.adminUpdateUserAttributes(params).promise();
           await cognito.adminSetUserPassword(_params).promise();
           return sendResponse(200, {message: 'Email verified successfully'})
        }catch(err){
            console.error(err.stack);
            return sendResponse(501, {message: err.stack})
        }
    }else{
        return sendResponse(404, {message: 'Incorrect authentication code'})
    }
}


export const handler = confirm_email