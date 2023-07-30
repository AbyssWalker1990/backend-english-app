const express = require('express')
const User = require('../models/User')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/multer')
const uploadFile = require('../middleware/uploadFile')
const fs = require('fs')

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
    // const { photo, objectives, priority } = req.body
    const image = req.file.originalname
    console.log('image: ', image)
    console.log('req: ', req.headers)

    res.status(200).json({ username: currentUser.username })
  }

  setProfileDescription = async (req, res) => {
    const {
      course,
      objectives,
      priorities,
      hobbies
    } = req.body.profileData
    console.log(
      course,
      objectives,
      priorities,
      hobbies)
  }
}

module.exports = ProfileController
