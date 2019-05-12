const uuid = require('uuid')
const AWS = require('aws-sdk')

const dynamoDB = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
  params: {
    Bucket: process.env.BUCKET,
  },
})

const uploadReportImages = async (report, id) => {
  if (!report.images) {
    return []
  }

  return Promise.all(
    report.images.map((image, index) => {
      const imageToUpload = {
        Body: Buffer.from(
          image.replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        ),
        Key: `${id}-${index}.jpg`,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        ContentEncoding: 'base64',
      }

      return s3.upload(imageToUpload, { ACL: 'public-read' }).promise()
    }),
  )
}

module.exports.create = async event => {
  const report = JSON.parse(event.body)

  const timestamp = new Date().getTime()
  const id = uuid.v1()

  try {
    const images = await uploadReportImages(report, id)
    const filteredReport = Object.entries(report).reduce(
      (acc, [key, value]) => (value ? { ...acc, [key]: value } : acc),
      {},
    )
    const postData = {
      TableName: process.env.TABLE,
      Item: {
        ...filteredReport,
        id,
        images,
        createdAt: timestamp,
      },
    }
    const result = await dynamoDB.put(postData).promise()

    return {
      statusCode: 201,
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error(error)
    return error
  }
}
