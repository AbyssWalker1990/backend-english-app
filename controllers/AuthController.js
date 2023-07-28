const express = require('express')
const loginLimiter = require('../middleware/loginLimiter')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

class AuthController {
  path = '/auth'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}/register`, this.register)
    this.router.post(`${this.path}/login`, loginLimiter, this.login)
    this.router.get(`${this.path}/refresh`, this.refresh)
    this.router.post(`${this.path}/logout`, this.logout)
  }

  register = async (req, res, next) => {
    const { username, password, roles, email } = req.body
    const currentRoles = roles ?? ['User']
    // Confirm data
    if (!username || !password || !email || !Array.isArray(roles) || !roles.length) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate username
    const duplicateUser = await User.findOne({ username }).lean().exec()
    if (duplicateUser) {
      return res.status(409).json({ message: 'Duplicate username' })
    }

    const duplicateEmail = await User.findOne({ email }).lean().exec()
    if (duplicateEmail) {
      return res.status(409).json({ message: 'Duplicate email' })
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, password: hashedPwd, email, roles: currentRoles }

    // Create and store new user
    const user = await User.create(userObject)

    if (user) { // created
      res.status(201).json({ message: `New user ${username} created` })
    } else {
      res.status(400).json({ message: 'Invalid user data received' })
    }
  }

  login = async (req, res, next) => {
    const { username, password } = req.body
    console.log('username: ', username)
    console.log('password: ', password)

    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const foundUser = await User.findOne({ username }).exec()

    if (!foundUser || !foundUser.active) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
      httpOnly: true, // accessible only by web server
      secure: true, // https
      sameSite: 'None', // cross-site cookie
      maxAge: 7 * 24 * 60 * 60 * 1000 // cookie expiry: set to match rT
    })

    // Send accessToken containing username and roles
    res.json({ accessToken })
  }

  refresh = async (req, res) => {
    const cookies = req.cookies
    console.log('COOKIES: ', cookies)
    // console.log(req.headers)

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Forbidden' })

        const foundUser = await User.findOne({ username: decoded.username }).exec()

        if (!foundUser) return res.status(401).json({ message: 'Unauthorized' })

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              roles: foundUser.roles
            }
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' }
        )

        res.json({ accessToken })
      }
    )
  }

  logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204)
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
  }
}

module.exports = AuthController
