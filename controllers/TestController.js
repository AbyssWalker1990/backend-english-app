const express = require('express')
const verifyJWT = require('../middleware/verifyJWT')

class TestController {
  path = ''
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.get(`${this.path}/test`, verifyJWT, this.test)
  }

  test = (req, res) => {
    res.status(200).json({ message: 'Safe route SUCCESS' })
  }
}

module.exports = TestController
