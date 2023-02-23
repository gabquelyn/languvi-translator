import sendResponse from "../../lib/sendResponse";
import { get, query } from "../../lib/actions";
async function proofreaderPool(event, context){
    const user = event.requestContext.authorizer.jwt.claims.username
    const translator_result = await get(process.env.TRANSLATOR_TABLE, {email: user})
    if(translator_result.error){
        return sendResponse(404, {message: "Something went wrong, Translator not found"})
    }
    
    const params = {
        TableName: process.env.ORDERS_TABLE,
        IndexName : 'proofreadingQuery',
        KeyConditionExpression : "paid = :true AND proofreader = :null_value",
        ExpressionAttributeValues : {
          ":true": 1,
          ":null_value": "null",
        }
    }

    const response = await query(params);
    if(response.error){
       return sendResponse(501, {message: response.error.message})
    }
    const orders = response.data
    const translator_subjects = translator_result.subject_fields
    const translator_source_language = translator_result.language_pairs.map(object => object.source);
    const translator_target_language = translator_result.language_pairs.map(object => object.target);


    const output = orders.filter(order => (translator_subjects.includes(order.subject) && translator_source_language.includes(order.source) && translator_target_language.includes(order.target)))

    return sendResponse(200, {message: output})
}

export const handler = proofreaderPool;


