const dotenv = require('dotenv')
const mongoose = require('mongoose')
dotenv.config()
const App = require('./app')
const { connectDatabase } = require('./config/connectDatabase')
const AuthController = require('./controllers/AuthControler')

const PORT = process.env.PORT ?? 3501
const app = new App([
  new AuthController()
], PORT)

connectDatabase()
mongoose.connection.once('open', () => {
  console.log('Successfully connected to database!')
  app.listen()
})

module.exports = app
