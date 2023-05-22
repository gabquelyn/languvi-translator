import AWS from "aws-sdk";
import sendResponse from "../../lib/sendResponse";
const cognito = new AWS.CognitoIdentityServiceProvider();
async function forgot(event, context) {
  const { email } = event.pathParameters;
  const params = {
    ClientId: process.env.CLIENT_ID,
    Username: email,
  };

  try {
    const response = await cognito.forgotPassword(params).promise();
    return sendResponse(200, { message: response });
  } catch (err) {
    console.error(err);
    return sendResponse(502, { error: err.stack });
  }
}

export const handler = forgot;