const dotenv = require('dotenv')
const mongoose = require('mongoose')
dotenv.config()

mongoose.set('strictQuery', false)

const LOCAL_DB_URI = 'mongodb://admin:password@mongodb:27017'

const connectDatabase = () => {
  let uri
  if (process.env.NODE_ENV === 'development') {
    uri = LOCAL_DB_URI
  } else {
    uri = process.env.DATABASE_URI
  }
  mongoose.connect(uri)
    .then(() => { console.log('Connect to: ', uri) })
    .catch((err) => {
      console.log(err)
    })
}

const closeDatabase = async () => {
  await mongoose.connection.close()
}

module.exports = { connectDatabase, closeDatabase }
