const dotenv = require('dotenv')
const express = require('express')
const User = require('../models/User')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-central-1'
}

const s3Client = new S3Client(s3Config)

class ProfileController {
  path = '/profile'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}/set-avatar`, verifyJWT, upload.single('imageInput'), this.setAvatar)
    this.router.post(`${this.path}`, verifyJWT, this.setProfileDescription)
  }

  setAvatar = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })

    const image = req.file.originalname
    console.log('image: ', image)
    console.log('buffer: ', req.file.buffer)

    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: req.file.originalname,
      Body: req.file.buffer
    }
    try {
      console.log('SENDING TO BUCKET')
      console.log('AWS_S3_BUCKET_NAME: ', process.env.AWS_S3_BUCKET_NAME)
      const data = await s3Client.send(new PutObjectCommand(bucketParams))
      console.log(data)
      // res.send(data)
    } catch (err) {
      console.log('Error', err)
    }

    res.status(200).json({ username: currentUser.username })
  }

  setProfileDescription = async (req, res) => {
    const { course, objectives, priorities, hobbies } = req.body.profileData

  }
}

module.exports = ProfileController
