const mongoose = require('mongoose')

const coursesAnswersSchema = new mongoose.Schema({
  lessons: [{
    lessonPosition: {
      type: Number,
      required: true
    },
    exercisesBlocks: [
      {
        blockPosition: {
          type: Number,
          required: true
        },
        blockExercises: [
          {
            exercisePos: {
              type: Number,
              required: true
            },
            studentsAnswer: {
              exerciseType: {
                type: String
              }
            }
          }
        ]
      }
    ]
  }
  ]
})

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
    },
    coursesAnswers: [coursesAnswersSchema]
  }
})

module.exports = mongoose.model('User', userSchema)
