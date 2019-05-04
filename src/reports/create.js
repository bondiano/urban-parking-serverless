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

  const encodedImages = report.images
  const imagesToUpload = encodedImages.map((encodedImage, index) => ({
    Body: Buffer.from(
      encodedImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    ),
    Key: `${id}-${index}.jpg`,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
    ContentEncoding: 'base64',
  }))

  return Promise.all(
    imagesToUpload.map(image =>
      s3.upload(image, { ACL: 'public-read' }).promise(),
    ),
  )
}

module.exports.create = async event => {
  const report = JSON.parse(event.body)

  const timestamp = new Date().getTime()
  const id = uuid.v1()

  try {
    const images = await uploadReportImages(report, id)
    const postData = {
      TableName: process.env.TABLE,
      Item: {
        ...report,
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
