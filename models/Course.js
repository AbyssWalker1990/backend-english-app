const mongoose = require('mongoose')

const wordCardsSchema = new mongoose.Schema({
  english: {
    type: String,
    required: true
  },
  ukrainian: {
    type: String,
    required: true
  }
})

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
    type: String
  },
  exercisesBlocks: [exercisesBlockSchema],
  wordCards: [wordCardsSchema]
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
