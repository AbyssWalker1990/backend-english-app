const dotenv = require('dotenv')
const mongoose = require('mongoose')
dotenv.config()
const App = require('./app')
const { connectDatabase } = require('./config/connectDatabase')
const AuthController = require('./controllers/AuthController')
const TestController = require('./controllers/TestController')
const CourseController = require('./controllers/CourseController')
const ProfileController = require('./controllers/ProfileController')

const PORT = process.env.PORT ?? 3501
const app = new App([
  new AuthController(),
  new TestController(),
  new CourseController(),
  new ProfileController()
], PORT)

connectDatabase()
mongoose.connection.once('open', () => {
  console.log('Successfully connected to database!')
  app.listen()
})

module.exports = app
