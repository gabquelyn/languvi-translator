import sendResponse from "../../lib/sendResponse";
import { get, query } from "../../lib/actions";
async function translatorPool(event, context) {
  const user = event.requestContext.authorizer.jwt.claims.username;
  let pool = [],
    ExpressionAttributeValues;

  if (event.queryStringParameters?.proofread) {
    ExpressionAttributeValues = {
      ":state": "unassigned proofreading",
    };
  } else {
    ExpressionAttributeValues = {
      ":state": "unassigned translation",
    };
  }

  const translator_result = await get(process.env.TRANSLATOR_TABLE, {
    email: user,
  });
  if (translator_result.error) {
    return sendResponse(404, {
      message: "Something went wrong, Translator not found",
    });
  }

  if (translator_result?.data.approved === "false") {
    return sendResponse(403, {
      message: "Unapproved translator cannot view or participate in pools",
    });
  }

  const params = {
    TableName: process.env.ORDERS_TABLE,
    IndexName: "orderStatus",
    KeyConditionExpression: "standing = :state",
    ExpressionAttributeValues,
  };

  const response = await query(params);
  if (response.error) {
    return sendResponse(501, { message: response.error.message });
  }
  const orders = response.data;
  const translator_language_pairs =
    translator_result.data._details.language_pairs;

  const source = translator_language_pairs.map((pair) =>
    pair.from.toLowerCase()
  );
  const target = translator_language_pairs.map((pair) => pair.to.toLowerCase());

  if (orders.Count > 0) {
    pool = orders.Items.filter(
      (order) =>
        source.includes(order.source_lang) &&
        target.includes(order.target_lang) &&
         (order.cancelled === "false") &&
        (order.allow_automatic === "true")
    ).map(({ cost, filekeys, owner, ...rest }) => rest);
  }

  return sendResponse(200, { message: pool });
}

export const handler = translatorPool;
