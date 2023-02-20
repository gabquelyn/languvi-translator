import AWS from "aws-sdk"
const dynamodb = new AWS.DynamoDB.DocumentClient();
async function getItem(table, key){
    let data;
    let error
    try{
        const result = await dynamodb.get({
            TableName: table,
            Key: key
        }).promise()
        data = result.Item
    }catch(err){
        error = err
    }
    
    return {
        data, error
    }
}

export const get = getItem


async function putItem(table, item){
    let error;

    try{
        await dynamodb.put({
            TableName: table,
            Item: item
        }).promise()
    }catch(err){
        error = err
    }

    return{
        error
    }
}

export const put = putItem


async function updateItem(params){
    let data;
    let error;

    try {
        const result = await dynamodb.update(params).promise()
        data = result
    }catch(err){
        error = err
    }

    return {
        error, data
    }
}

export const update = updateItem