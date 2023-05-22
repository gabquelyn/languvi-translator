import sendResponse from "../../lib/sendResponse";
import AWS from "aws-sdk";
const dynamodb = new AWS.DynamoDB.DocumentClient();
const getJobs = async (event, context) => {
  const user = event.requestContext.authorizer.jwt.claims.username;
  const t_params = {
   TableName: process.env.ORDERS_TABLE,
   IndexName: "translateprojects",
   KeyConditionExpression: "translator = :t",
   ExpressionAttributeValues: {
     ":t": user,
   },
 };

 const p_params = {
   TableName: process.env.ORDERS_TABLE,
   IndexName: "proofreadProjects",
   KeyConditionExpression: "proofreader = :p",
   ExpressionAttributeValues: {
     ":p": user,
   },
 };

 const t_result = await dynamodb.query(t_params).promise();
 const p_result = await dynamodb.query(p_params).promise();

 const ALL = t_result.Items.concat(p_result.Items);

const translated_jobs = ALL.filter(
   (job) => job.standing === "translating" && job.cancelled !== "true"
 );

const proofread_jobs = ALL.filter(
   (job) => job.standing === "proofreading" && job.cancelled !== "true"
 );

 const revision_jobs = ALL.filter(
   (job) => job.standing === "revision" && job.cancelled !== "true"
 );

 const completed_jobs = ALL.filter(
   (job) => job.standing === "completed" && job.cancelled !== "true"
 );

return sendResponse(200, {translated_jobs, proofread_jobs, revision_jobs, completed_jobs})
};
export const handler = getJobs;
