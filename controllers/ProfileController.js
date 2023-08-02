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
    const { course, objectives, priorities, hobbies } = req.body
    const currentUser = await User.findOne({ username: req.user })
    currentUser.profile.objectives = objectives
    currentUser.profile.priorities = priorities
    currentUser.profile.hobbies = hobbies
    currentUser.profile.activeCourse = course
    if (!currentUser.profile.courses.includes(course)) {
      currentUser.profile.courses = [...currentUser.profile.courses, course]
    }
    await currentUser.save()
    res.status(200).json({ message: 'Profile Updated' })
  }

  getProfile = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })
    const { photo, objectives, priorities, hobbies, courses, activeCourse, coursesAnswers } = currentUser.profile
    res.status(200).json({ photo, objectives, priorities, hobbies, courses, activeCourse, coursesAnswers })
  }

  setAnswers = async (req, res) => {
    const currentUser = await User.findOne({ username: req.user })
    const { courseId, lessonPosition, blockPosition, exerciseAnswers } = req.body
    const currentCourse = await Course.findById(courseId).exec()
    // console.log(currentCourse)
    if (!currentUser.coursesAnswers) currentUser.coursesAnswers = []
    console.log('currentUser.coursesAnswers: ', currentUser.coursesAnswers)

    if (!currentUser.coursesAnswers.find(answer => answer.courseId === courseId)) {
      const lessonData = currentCourse.lessons.map(lesson => {
        return { lessonPosition }
      })

      lessonData.forEach(lesson => {
        const curLesson = currentCourse.lessons.find(courseLesson => courseLesson.lessonPosition === lesson.lessonPosition)
        lesson.exercisesBlocks = curLesson.exercisesBlocks.map(block => {
          return {
            blockPosition,
            blockExercises: curLesson.exercisesBlocks[block.blockPosition - 1].blockExercises.map(exercise => ({ exercisePos: exercise.exercisePos }))
          }
        })
      })

      const courseAnswerData = {
        courseId,
        lessons: lessonData
      }

      console.log(JSON.stringify(courseAnswerData, 0, 2))
    }
  }
}

module.exports = ProfileController
