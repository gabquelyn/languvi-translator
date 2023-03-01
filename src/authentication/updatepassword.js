import sendResponse from "../../lib/sendResponse";
import AWS from 'aws-sdk'
const cognito = new AWS.CognitoIdentityServiceProvider();
async function chagePassword(event, context){
const {previous_password, new_password} = JSON.parse(event.body);
const AccessToken = event.headers['authorization'].replace('Bearer', '')

const params = {
    AccessToken,
    PreviousPassword: previous_password,
    ProposedPassword: new_password
  };

    try{
        await cognito.changePassword(params).promise()
    }catch(err){
        console.error(err)
        return sendResponse(501, {message: err.message})
    }

    return sendResponse(200, {message: 'Password changed successfully!'})
}

export const handler = chagePassword;