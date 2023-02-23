import {get, update} from "../../lib/actions";
import sendResponse from "../../lib/sendResponse";
async function pickToProofread(event, context){
    const user = event.requestContext.authorizer.jwt.claims.username;
    const { orderId } = event.pathParameters;
    const user_result = await get(process.env.TRANSLATOR_TABLE, {email: user});
    if(user_result.error){
        return sendResponse(501, {message: 'Something went wrong!'})
    }
    if(user_result.data.approved == 'false'){
        return sendResponse(405, {message: 'You have not been approved to carry out order actions yet!'});
    }

    const order_result = await get(process.env.ORDERS_TABLE, {id: orderId});
    if(order_result.error){
        return sendResponse(501, {message: order_result.error.message})
    }
    if(order_result.data.translator == user){
        return sendResponse(405, {message: "You are not allowed to proofread this!"})
    }

    const params = {
        TableName: process.env.ORDERS_TABLE,
        Key: {id: orderId},
        UpdateExpression: 'set #proofreader = :email',
        ExpressionAttributeValues: {
            ':email' : user
        },
        ExpressionAttributeNames: {
            '#proofreader' : 'proofreader'
        }
    }

    const update_result = await update(params)
    if(result.error){
        return sendResponse(501, {message: update_result.error.message})
    }

    return sendResponse(201, {message: `${user} is the proofreader for the project with id: ${orderId}`})
}

export const handler = pickToProofread