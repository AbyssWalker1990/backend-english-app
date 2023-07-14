const express = require('express')

class AuthController {
  path = '/auth'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.get(this.path, (req, res) => {
      res.send('Hello')
    })
  }
}

module.exports = AuthController
