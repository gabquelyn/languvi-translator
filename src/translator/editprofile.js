import sendResponse from "../../lib/sendResponse";
import { update } from "../../lib/actions";
import { uploadPictureToS3 } from "../../lib/uploadImage";
async function editProfile(event, context){
    const new_profile = JSON.parse(event.body)
    const user = event.requestContext.authorizer.jwt.claims.username
    const base64 = new_profile.image.replace(/^data:image\/\w+;base64,/,'');
    const buffer = Buffer.from(base64, 'base64')
    let imageUrl
    try{
        const uploadtoS3Result = await uploadPictureToS3(user + '.jpg', buffer);
        imageUrl = uploadtoS3Result.Location;
        console.log(uploadtoS3Result);
    }catch(err){
        console.error(err)
        return sendResponse(501, {message: err.message})
    }
    new_profile.image = imageUrl
    const params = {
        TableName: process.env.TRANSLATOR_TABLE,
        Key: {email: user},
        UpdateExpression: 'set #former_profile = :new_profile',
        ExpressionAttributeValues: {
            ':new_profile' : new_profile
        },
        ExpressionAttributeNames: {
            '#former_profile' : 'profile'
        }
    }
    const result = await update(params)
    if(result.error){
        return sendResponse(501, {message: "Something went wrong!"})
    }
    return sendResponse(200, {message: `${user} details updated successfuly!`})
}

export const handler = editProfile;