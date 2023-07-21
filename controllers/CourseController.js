const express = require('express')
const Course = require('../models/Course')

class CourseController {
  path = '/courses'
  router = express.Router()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}`, this.createCourse)
    this.router.get(`${this.path}`, this.getAllCourses)
  }

  createCourse = async (req, res, next) => {
    const { title, description, lessons } = req.body

    lessons.forEach(element => {
      console.log(element.lessonExercises)
    })
    try {
      const newCourse = await Course.create({
        title,
        description,
        lessons: [...lessons]
      })
      // console.log(newCourse)
      res.status(201).json({ success: `New Training ${newCourse.title} created!!!` })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  getAllCourses = async (req, res, next) => {
    try {
      const courses = await Course.find()
      res.status(200).json({ courses })
    } catch (error) {

    }
  }
}

module.exports = CourseController
