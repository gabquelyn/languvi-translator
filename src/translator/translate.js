import {get, update} from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
async function pickToTranslate(event, context){
    const { orderId } = event.pathParameters;
    const user = event.requestContext.authorizer.jwt.claims.username;
    const user_result = await get(process.env.TRANSLATOR_TABLE, {email: user});
    if(user_result.error){
        return sendResponse(501, {message: 'Something went wrong!'})
    }
    if(user_result.data.approved == 'false'){
        return sendResponse(405, {message: 'You have not been approved to carry out order actions yet!'});
    }

    const params = {
        TableName: process.env.ORDERS_TABLE,
        Key: {id: orderId},
        UpdateExpression: 'set #translator = :email',
        ExpressionAttributeValues: {
            ':email' : user
        },
        ExpressionAttributeNames: {
            '#translator' : 'translator'
        }
    }
    
    const result = await update(params)
    if(result.error){
        return sendResponse(501, {message: result.error.message})
    }
    return sendResponse(201, {message: `${user} is the translator for the project with id: ${orderId}`})
}
    

export const handler = pickToTranslate