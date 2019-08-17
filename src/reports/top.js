const AWS = require('aws-sdk')

const dynamoDB = new AWS.DynamoDB.DocumentClient()
const tableParams = {
  TableName: process.env.TABLE,
}

module.exports.list = async () => {
  try {
    const result = await dynamoDB.scan(tableParams).promise()
    const countByEmail = result.Items.reduce(
      (acc, val) =>
        val.email
          ? {
              ...acc,
              [val.email]: acc[val.email] ? acc[val.email] + 1 : 1,
            }
          : acc,
      {},
    )
    const sortedByCount = Object.entries(countByEmail)
      .reduce(
        (acc, [email, count]) => [
          ...acc,
          {
            email,
            count,
          },
        ],
        [],
      )
      .sort(({ count: aCount }, { count: bCount }) => aCount - bCount)
    return {
      statusCode: 200,
      body: JSON.stringify(sortedByCount || []),
    }
  } catch (error) {
    console.error(error)
    return error
  }
}
