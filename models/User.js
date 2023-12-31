const mongoose = require('mongoose')

const successRecord = new mongoose.Schema(
  {
    successRecord: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

const coursesAnswersSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true
  },
  lessons: [
    {
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
                type: String
              }
            }
          ]
        }
      ]
    }
  ],
  courseResults: [
    {
      lessonPosition: {
        type: Number,
        required: true
      },
      lessonResultPercent: {
        type: Number
      },
      lessonResultRight: {
        type: Number
      },
      lessonResultWrong: {
        type: Number
      },
      exercisesBlocks: [
        {
          blockPosition: {
            type: Number,
            required: true
          },
          blockResultPercent: {
            type: Number
          },
          blockResultRight: {
            type: Number
          },
          blockResultWrong: {
            type: Number
          },
          blockExercises: [
            {
              exercisePos: {
                type: Number,
                required: true
              },
              studentsAnswer: {
                type: String
              },
              exerciseResult: {
                type: Boolean
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
  roles: [
    {
      type: String,
      default: 'User'
    }
  ],
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
      type: [String]
    },
    priorities: {
      type: [String]
    },
    hobbies: {
      type: [String]
    },
    coursesAnswers: [coursesAnswersSchema],
    successDiary: {
      type: [successRecord],
      default: []
    }
  },
  gender: {
    type: String,
    default: 'male'
  }
})

module.exports = mongoose.model('User', userSchema)
