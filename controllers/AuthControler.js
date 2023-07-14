const express = require('express')
const loginLimiter = require('../middleware/loginLimiter')
const User = require('../models/User')
const bcrypt = require('bcrypt')

class AuthController {
  path = '/auth'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}/register`, this.register)
  }

  register = async (req, res, next) => {
    const { username, password, roles } = req.body

    // Confirm data
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate username
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate username' })
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, password: hashedPwd, roles }

    // Create and store new user
    const user = await User.create(userObject)

    if (user) { // created
      res.status(201).json({ message: `New user ${username} created` })
    } else {
      res.status(400).json({ message: 'Invalid user data received' })
    }
  }
}

module.exports = AuthController
