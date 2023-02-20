function sendResponse(status, output){
    return {
        statusCode: status,
        body: JSON.stringify(output)
    }
}

export default sendResponse;