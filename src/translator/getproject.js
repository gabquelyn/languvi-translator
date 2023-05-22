import AWS from "aws-sdk";
import sendResponse from "../../lib/sendResponse";
const dynamodb = new AWS.DynamoDB.DocumentClient();
async function getproject(event, context) {
  const user = event.requestContext.authorizer.jwt.claims.username;
  const { orderId } = event.pathParameters;
  const project = await dynamodb
    .get({
      TableName: process.env.ORDERS_TABLE,
      Key: { id: orderId },
    })
    .promise();

  const { proofreader, translator } = project.Item;

  if (proofreader == user || translator == user) {
    return sendResponse(200, {project: project.Item});
  }

  return sendResponse(405, {error: "Access Denied" });
}

export const handler = getproject;
