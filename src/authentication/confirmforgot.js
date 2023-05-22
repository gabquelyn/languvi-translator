import AWS from "aws-sdk";
import sendResponse from "../../lib/sendResponse";
const cognito = new AWS.CognitoIdentityServiceProvider();
async function confirmForgot(event, context) {
  const { code, email, new_password } = JSON.parse(event.body);
  const params = {
    ClientId: process.env.CLIENT_ID,
    ConfirmationCode: code,
    Password: new_password,
    Username: email,
  };

  try {
    await cognito.confirmForgotPassword(params).promise();
    return sendResponse(200, { message: "new password set" });
  } catch (err) {
    console.error(err);
    return sendResponse(501, { message: err.stack });
  }
}

export const handler = confirmForgot;
