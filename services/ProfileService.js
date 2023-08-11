const User = require('../models/User')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3Config = require('../config/s3Config')

class ProfileService {
  uploadAndSetPhoto = async (username, photo) => {
    const s3Client = new S3Client(s3Config)
    const currentUser = await User.findOne({ username })

    const formattedName = this.generatePhotoName(photo)

    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: formattedName,
      Body: photo.buffer
    }
    await s3Client.send(new PutObjectCommand(bucketParams))
    currentUser.profile.photo = `https://english-learn-app.s3.eu-central-1.amazonaws.com/${formattedName}`
    await currentUser.save()

    return true
  }

  generatePhotoName = (photo) => {
    const ext = photo.mimetype.split('/')[1]
    const name = photo.originalname.split('.')[0]
    return `${name}-${new Date().getTime()}.${ext}`
  }
}

module.exports = ProfileService
