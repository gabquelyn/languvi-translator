import AWS from "aws-sdk";
import sendResponse from "../../lib/sendResponse";
import { put } from "../../lib/actions";
import multipart from "lambda-multipart-parser"
const cognito = new AWS.CognitoIdentityServiceProvider();
const tableName = process.env.TRANSLATOR_TABLE;
const UserPoolId = process.env.USER_POOL_ID;
const S3 = new AWS.S3();
async function signup(event, context) {
  const translator_input = multipart.parse(event);
  const filetype = translator_input.files[0].contentType;
  const filename = translator_input.files[0].filename;
  const filecontent = translator_input.files[0].content;
  const firstname = translator_input.firstname;
  const lastname = translator_input.dueDate;
  const phone = translator_input.phone;
  const email = translator_input.email;
  const password = translator_input.password;
  const experience = translator_input.experience;
  const lingiustic_service = JSON.parse(translator_input.lingiustic_service);
  const language_pairs  = JSON.parse(translator_input.language_pairs);
  const subject_fields  = JSON.parse(translator_input.subject_fields);
  

  try{
    await S3.putObject({
      Bucket: process.env.TRANSLATOR_BUCKET,
      Key: `resumes/${filename}`,
      Body: filecontent,
      ContentType: filetype
    }).promise()
  }catch(err){
    console.error(err)
    return sendResponse(501, {message: err.message})
  }
  
  const fileurl = `https://${process.env.TRANSLATOR_BUCKET}.s3.amazonaws.com/resumes/${filename}`
  

  let result;
  const params = {
    UserPoolId,
    Username: email,
    MessageAction: "SUPPRESS",
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };

  const Item = {
    email,
    approved: "false",
    profile: {
      firstname,
      lastname,
      phone,
      addressline: "null",
      country: "null",
      nativelanguage: "null",
      image: "null",
    },
    _details: {
        experience,
        lingiustic_service,
        language_pairs,
        subject_fields,
        resume : fileurl
    },
    projects: [],
    authToken: "null"
  };

  const _params = {
    Password: password,
    UserPoolId: process.env.USER_POOL_ID,
    Username: email,
    Permanent: true
}

  try {
    const response = await cognito.adminCreateUser(params).promise();
    await cognito.adminSetUserPassword(_params).promise();
    result = response;
  } catch (err) {
    console.error(err);
    return sendResponse(501, {
      message: "Something went wrong!",
      error: err.stack,
    });
  }

  if (result.User) {
    const result = await put(tableName, Item);
    if (result.error) {
      return sendResponse(501, { message: result.error.message });
    }
    return sendResponse(201, {message: "User created successfully!"})
  }
}

export const handler = signup;
