const mongoose = require('mongoose')

const exercisesSchema = new mongoose.Schema({
  exercisePos: {
    type: Number,
    required: true
  },
  exerciseType: {
    type: String,
    required: true
  },
  exerciseDescription: {
    type: String,
    required: true
  },
  exerciseQuizAnswers: [String],
  correctAnswer: {
    type: String,
    required: true
  }
})

const exercisesBlockSchema = new mongoose.Schema({
  blockPosition: {
    type: Number,
    required: true
  },
  blockDescription: {
    type: String,
    required: true
  },
  blockExercises: [exercisesSchema]
})

const lessonSchema = new mongoose.Schema({
  lessonTitle: {
    type: String,
    required: true
  },
  lessonPosition: {
    type: Number,
    required: true
  },
  lessonDescription: {
    type: String,
    required: true
  },
  exercisesBlocks: [exercisesBlockSchema]
})

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  lessons: [lessonSchema]
})

module.exports = mongoose.model('Course', courseSchema)
