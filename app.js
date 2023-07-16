const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { logToConsoleAndFile, logFormat } = require('./config/morganOptions')
const cookieParser = require('cookie-parser')

class App {
  constructor (controllers, port) {
    this.app = express()
    this.port = port
    this.initMiddlewares()
    this.initControllers(controllers)
  }

  initMiddlewares () {
    this.app.use(morgan(logFormat, { stream: { write: logToConsoleAndFile } }))
    this.app.use(cors())
    this.app.use(cookieParser())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(express.json())
  }

  initControllers (controllers) {
    controllers.forEach((controller) => {
      this.app.use('/', controller.router)
    })
  }

  listen () {
    this.app.listen(this.port, () => {
      console.log(`App listening on port: ${this.port}`)
    })
  }
}

module.exports = App
