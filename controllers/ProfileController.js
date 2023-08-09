const dotenv = require('dotenv')
const express = require('express')
const User = require('../models/User')
const Course = require('../models/Course')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/multer')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-central-1'
}

const s3Client = new S3Client(s3Config)

class ProfileController {
  path = '/profile'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}/set-avatar`, verifyJWT, upload.single('imageInput'), this.setAvatar)
    this.router.post(`${this.path}`, verifyJWT, this.setProfileDescription)
    this.router.post(`${this.path}/init-answers`, verifyJWT, this.setInitAnswers)
    this.router.post(`${this.path}/calc-lesson`, verifyJWT, this.calculateLessonResult)
    this.router.patch(`${this.path}/answers`, verifyJWT, this.setAnswers)
    this.router.get(`${this.path}`, verifyJWT, this.getProfile)
  }

  setAvatar = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })

    console.log(req.file)
    const ext = req.file.mimetype.split('/')[1]
    const name = req.file.originalname.split('.')[0]

    const formattedName = `${name}-${new Date().getTime()}.${ext}`
    const file = req.file.buffer

    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: formattedName,
      Body: file
    }
    try {
      await s3Client.send(new PutObjectCommand(bucketParams))
      currentUser.profile.photo = `https://english-learn-app.s3.eu-central-1.amazonaws.com/${formattedName}`
      await currentUser.save()
    } catch (err) {
      console.log('Error', err)
    }

    res.status(200).json({ username: currentUser.username })
  }

  setProfileDescription = async (req, res) => {
    console.log(req.body)
    console.log(req.user)
    const { course, objectives, priorities, hobbies } = req.body
    const currentUser = await User.findOne({ username: req.user })
    const currentCourse = await Course.findOne({ title: course })
    currentUser.profile.objectives = objectives
    currentUser.profile.priorities = priorities
    currentUser.profile.hobbies = hobbies
    currentUser.profile.activeCourse = course
    if (!currentUser.profile.courses.includes(course)) {
      currentUser.profile.courses = [...currentUser.profile.courses, course]
    }
    await currentUser.save()
    if (!currentUser.profile.coursesAnswers.find(answer => answer.courseId === currentCourse._id)) {
      await this.setInitAnswers(currentCourse._id.toString(), req.user)
    }
    res.status(200).json({ message: 'Profile Updated' })
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

  setInitAnswers = async (courseId, username) => {
    console.log('setInitAnswers TRIGGERED')
    console.log('courseId: ', courseId)

    console.log('username: ', username)

    const currentUser = await User.findOne({ username })
    const currentCourse = await Course.findById(courseId).exec()
    if (!currentUser.coursesAnswers) {
      currentUser.coursesAnswers = []
      currentUser.save()
    }
    // console.log('currentUser.coursesAnswers: ', currentUser.coursesAnswers)

    if (currentUser.profile.coursesAnswers.find(answer => answer.courseId === courseId) === undefined) {
      console.log('Have no answers data')
      const lessonData = currentCourse.lessons.map(lesson => {
        return { lessonPosition: lesson.lessonPosition }
      })
      lessonData.forEach(lesson => {
        const curLesson = currentCourse.lessons.find(courseLesson => courseLesson.lessonPosition === lesson.lessonPosition)
        lesson.exercisesBlocks = curLesson.exercisesBlocks.map(block => {
          return {
            blockPosition: block.blockPosition,
            blockExercises: curLesson.exercisesBlocks[block.blockPosition - 1].blockExercises.map(exercise => ({ exercisePos: exercise.exercisePos }))
          }
        })
      })

      const courseAnswerData = {
        courseId,
        lessons: lessonData
      }

      console.log(JSON.stringify(courseAnswerData, 0, 2))
      try {
        const currentUser2 = await User.findOne({ username })
        currentUser2.profile.coursesAnswers = [...currentUser.coursesAnswers, courseAnswerData]
        console.log('currentUser2: ', currentUser2.profile.coursesAnswers)
        await currentUser2.save()
      } catch (error) {
        console.log('Error from generated: ', error)
      }
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
