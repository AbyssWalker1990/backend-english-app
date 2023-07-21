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
    this.router.get(`${this.path}/:courseId`, this.getCourseById)
    this.router.delete(`${this.path}/:courseId`, this.deleteCourseById)
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
      res.status(201).json({ success: `New Course ${newCourse.title} created!!!` })
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
      console.log(error)
      next(error)
    }
  }

  getCourseById = async (req, res, next) => {
    const courseId = req.params.courseId
    try {
      const course = await Course.findById(courseId)
      res.status(200).json({ course })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  deleteCourseById = async (req, res, next) => {
    const courseId = req.params.courseId
    try {
      const deletedCourse = await Course.findByIdAndDelete(courseId)
      res.status(200).json({ deleted: deletedCourse.title })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
}

module.exports = CourseController
