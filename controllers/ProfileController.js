const express = require('express')
const User = require('../models/User')
const verifyJWT = require('../middleware/verifyJWT')

class ProfileController {
  path = '/profile'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}`, verifyJWT, this.createProfile)
  }

  createProfile = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })
    res.status(200).json({ username: currentUser.username })
  }
}

module.exports = ProfileController
