const AWS = require('aws-sdk')

const dynamoDB = new AWS.DynamoDB.DocumentClient()
const tableParams = {
  TableName: process.env.TABLE,
}

module.exports.list = async event => {
  try {
    const result = await dynamoDB.scan(tableParams).promise()

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    }
  } catch (error) {
    console.error(error)
    return error
  }
}
