const express = require('express')
const User = require('../models/User')
const verifyJWT = require('../middleware/verifyJWT')
const upload = require('../middleware/multer')
const ProfileService = require('../services/ProfileService')

class ProfileController {
  path = '/profile'
  router = express.Router()
  profileService = new ProfileService()

  constructor() {
    this.initRoutes()
  }

  initRoutes() {
    this.router.get('/success_payment', (req, res) => res.redirect('https://e-w-s.netlify.app/success_payment'))
    this.router.post('/success_payment', this.processPayment)
    this.router.post(`${this.path}/set-avatar`, verifyJWT, upload.single('imageInput'), this.setAvatar)
    this.router.post(`${this.path}`, verifyJWT, this.setProfileDescription)
    this.router.post(`${this.path}/set-course`, verifyJWT, this.setProfileCourse)
    this.router.post(`${this.path}/calc-lesson`, verifyJWT, this.calculateLessonResult)
    this.router.patch(`${this.path}/answers`, verifyJWT, this.setAnswers)
    this.router.get(`${this.path}`, verifyJWT, this.getProfile)
  }

  processPayment = async (req, res, next) => {
    console.log('Process payment')
    const xmlData = req.body
    const course = req.body.DESCRIPTION
    const email = req.body.ATTRIBUTE1
    console.log(xmlData)
    console.log('course: ', course)
    console.log('email: ', email)

    const currentUser = await User.findOne({ email })
    currentUser.profile.courses.push(course)
    await this.profileService.setProfileActiveCourse(course, currentUser.username)
    res.redirect('https://e-w-s.netlify.app/success_payment')
  }

  setAvatar = async (req, res, next) => {
    try {
      const isSetPhoto = await this.profileService.uploadAndSetPhoto(req.user, req.file)
      if (isSetPhoto) res.status(200).json({ success: 'Photo added' })
    } catch (error) {
      next(error)
    }
  }

  setProfileCourse = async (req, res, next) => {
    try {
      const { courseTitle, username } = req.body
      await this.profileService.setProfileActiveCourse(courseTitle, username)
      res.status(200).json({ success: 'Active course updated!' })
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
    const { gender } = currentUser
    res.status(200).json({ photo, objectives, priorities, hobbies, courses, activeCourse, coursesAnswers, gender })
  }

  setAnswers = async (req, res, next) => {
    try {
      const isUpdated = await this.profileService.updateAnswers(req.user, req.body)
      res.status(200).json(isUpdated)
    } catch (error) {
      next(error)
    }
  }

  calculateLessonResult = async (req, res, next) => {
    try {
      const curLesson = await this.profileService.updateResult(req.user, req.body)
      res.status(200).json({ curLesson, success: true })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = ProfileController
