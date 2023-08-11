const express = require('express')
const loginLimiter = require('../middleware/loginLimiter')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const AuthService = require('../services/AuthService')

class AuthController {
  path = '/auth'
  router = express.Router()
  authService = new AuthService()

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
    try {
      const user = await this.authService.createNewUser(req.body)
      res.status(201).json({ message: `New user ${user.username} created` })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  login = async (req, res, next) => {
    try {
      const { accessToken, refreshToken } = await this.authService.authUser(req.body)
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      res.json({ accessToken })
    } catch (error) {
      next(error)
    }
  }

  refresh = async (req, res, next) => {
    try {
      const accessToken = await this.authService.getNewAccessToken(req.cookies)
      res.status(200).json({ accessToken })
    } catch (error) {
      next(error)
    }
  }

  logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204)
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
  }
}

module.exports = AuthController
