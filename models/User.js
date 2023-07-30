const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  roles: [{
    type: String,
    default: 'User'
  }],
  active: {
    type: Boolean,
    default: true
  },
  profile: {
    photo: {
      type: String
    },
    courses: [String],
    activeCourse: {
      type: String
    },
    objectives: {
      type: String
    },
    priorities: {
      type: String
    },
    hobbies: {
      type: String
    }
  }
})

module.exports = mongoose.model('User', userSchema)
