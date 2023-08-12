const dotenv = require('dotenv')
const express = require('express')
const User = require('../models/User')
const Course = require('../models/Course')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/multer')
const ProfileService = require('../services/ProfileService')

class ProfileController {
  path = '/profile'
  router = express.Router()
  profileService = new ProfileService()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}/set-avatar`, verifyJWT, upload.single('imageInput'), this.setAvatar)
    this.router.post(`${this.path}`, verifyJWT, this.setProfileDescription)
    this.router.post(`${this.path}/calc-lesson`, verifyJWT, this.calculateLessonResult)
    this.router.patch(`${this.path}/answers`, verifyJWT, this.setAnswers)
    this.router.get(`${this.path}`, verifyJWT, this.getProfile)
  }

  setAvatar = async (req, res, next) => {
    try {
      const isSetPhoto = await this.profileService.uploadAndSetPhoto(req.user, req.file)
      if (isSetPhoto) res.status(200).json({ success: 'Photo added' })
    } catch (error) {
      next(error)
    }
  }

  setProfileDescription = async (req, res) => {
    const updated = await this.profileService.setProfileData(req.user, req.body)
    if (updated) res.status(200).json({ message: 'Profile Updated' })
  }

  getProfile = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })
    const { photo, objectives, priorities, hobbies, courses, activeCourse, coursesAnswers } = currentUser.profile
    res.status(200).json({ photo, objectives, priorities, hobbies, courses, activeCourse, coursesAnswers })
  }

  setAnswers = async (req, res) => {
    const { courseId, lessonPosition, blockPosition, exerciseAnswers } = req.body
    const currentUser = await User.findOne({ username: req.user })
    console.log('lessonPosition: ', lessonPosition)

    if (currentUser.profile.coursesAnswers.find(answer => answer.courseId === courseId) === undefined) {
      await this.setInitAnswers(courseId, req.username)
    }

    console.log('do nothing')

    try {
      const currentUser3 = await User.findOne({ username: req.user })
      console.log(exerciseAnswers)
      console.log(Array.isArray(exerciseAnswers))

      if (currentUser3.profile.coursesAnswers.find(course => course.courseId === courseId)
        .lessons.find(lesson => lesson.lessonPosition === lessonPosition) === undefined) {
        console.log('creating Lesson')
        currentUser3.profile.coursesAnswers.find(course => course.courseId === courseId)
          .lessons.push({
            lessonPosition
          })
      }

      if (currentUser3.profile.coursesAnswers.find(course => course.courseId === courseId)
        .lessons.find(lesson => lesson.lessonPosition === lessonPosition)
        .exercisesBlocks.find(block => block.blockPosition === blockPosition) !== undefined) {
        console.log('triggered if')
        currentUser3.profile.coursesAnswers.find(course => course.courseId === courseId)
          .lessons.find(lesson => lesson.lessonPosition === lessonPosition)
          .exercisesBlocks.find(block => block.blockPosition === blockPosition).blockExercises = exerciseAnswers
        currentUser3.save()
      } else {
        const newBlock = { blockPosition, blockExercises: exerciseAnswers }
        currentUser3.profile.coursesAnswers.find(course => course.courseId === courseId)
          .lessons.find(lesson => lesson.lessonPosition === lessonPosition).exercisesBlocks.push(newBlock)
        currentUser3.save()
      }
    } catch (error) {
      console.log('Error from received data: ', error)
    }
  }

  calculateLessonResult = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user }).exec()
    const { courseId, lessonPos } = req.body
    console.log('calculateLessonResult Triggered')
    const curLesson = await this.getLessonByPosition(courseId, lessonPos)
    const curLessonAnswers = await this.getLessonAnswersByPosition(courseId, lessonPos, currentUser)
    // console.log('curLesson: ', curLesson)
    // console.log('curLessonAnswers: ', curLessonAnswers)

    // console.log('curLessonAnswers: ', curLessonAnswers)

    let lessonResult = JSON.parse(JSON.stringify(curLessonAnswers))
    lessonResult = {
      ...lessonResult,
      lessonResultPercent: 0,
      lessonResultRight: 0,
      lessonResultWrong: 0
    }

    let lessonResultRight = 0
    let lessonResultWrong = 0
    let exerciseCount = 0
    lessonResult.exercisesBlocks.forEach((block, blockIndex) => {
      block.blockExercises.forEach((exercise, exerciseIndex) => {
        exerciseCount += 1
        const blockRightAnswer = curLesson.exercisesBlocks[blockIndex]
        const correctAnswer = blockRightAnswer.blockExercises[exerciseIndex].correctAnswer
        console.log('correctAnswer: ', correctAnswer)
        exercise.exerciseResult = exercise.studentsAnswer.toLowerCase() === correctAnswer.toLowerCase()
      })
      block.blockResultRight = block.blockExercises.reduce((acc, exercise) => acc + exercise.exerciseResult, 0)
      lessonResultRight += block.blockResultRight
      console.log('lessonResultRight: ', lessonResultRight)
      block.blockResultWrong = block.blockExercises.length - block.blockResultRight
      lessonResultWrong += block.blockResultWrong
      block.blockResultPercent = block.blockResultRight / block.blockExercises.length * 100
    })
    lessonResult.lessonResultRight = lessonResultRight
    lessonResult.lessonResultWrong = lessonResultWrong
    lessonResult.lessonResultPercent = lessonResultRight / exerciseCount * 100

    if (currentUser.profile.coursesAnswers.find(answers => answers.courseId === courseId).courseResults === undefined) {
      currentUser.profile.coursesAnswers.find(answers => answers.courseId === courseId).courseResults = []
    }

    const resultsWithoutPrevios = currentUser.profile.coursesAnswers.find(answers => answers.courseId === courseId).courseResults.filter(result => {
      return result.lessonPosition !== Number(lessonPos)
    })
    console.log('resultsWithoutPrevios: ', resultsWithoutPrevios)

    currentUser.profile.coursesAnswers.find(answers => answers.courseId === courseId).courseResults = [...resultsWithoutPrevios, lessonResult]
    await currentUser.save()

    // console.log('result: ', JSON.stringify(lessonResult, 0, 2))
    console.log('res: ', currentUser.profile.coursesAnswers.find(answers => answers.courseId === courseId))
    res.status(200).json({ curLesson, success: true })
  }

  getLessonByPosition = async (courseId, lessonPos) => {
    const curCourse = await Course.findById(courseId).exec()
    const curLesson = curCourse.lessons.find(lesson => lesson.lessonPosition === Number(lessonPos))
    return curLesson
  }

  getLessonAnswersByPosition = async (courseId, lessonPos, currentUser) => {
    const courseAnswers = await currentUser.profile.coursesAnswers.find(course => course.courseId === courseId)
    const lessonAnswers = courseAnswers.lessons.find(lesson => lesson.lessonPosition === Number(lessonPos))
    return lessonAnswers
  }
}

module.exports = ProfileController
