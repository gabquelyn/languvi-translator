import sendResponse from "../../lib/sendResponse";
import { get } from "../../lib/actions";
async function getProfile(event, context){
    const user = event.requestContext.authorizer.jwt.claims.username
    const result = await get(process.env.TRANSLATOR_TABLE, {email: user})
    if(result.error){
        sendResponse(404, {message: "Something went wrong, Translator not found"})
    }
    return sendResponse(200, {message: result.data.profile, user})
}

export const handler = getProfile;