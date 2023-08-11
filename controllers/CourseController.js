const express = require('express')
const Course = require('../models/Course')
const CourseService = require('../services/CourseService')

class CourseController {
  path = '/courses'
  router = express.Router()
  courseService = new CourseService()

  constructor () {
    this.initRoutes()
  }

  initRoutes () {
    this.router.post(`${this.path}`, this.createCourse)
    this.router.get(`${this.path}`, this.getAllCourses)
    this.router.get(`${this.path}/test`, this.getTest)
    this.router.get(`${this.path}/:courseId`, this.getCourseById)
    this.router.delete(`${this.path}/:courseId`, this.deleteCourseById)
    this.router.patch(`${this.path}/:courseId`, this.updateCourseById)
  }

  createCourse = async (req, res, next) => {
    try {
      const newCourse = await this.courseService.addNewCourse()
      res.status(201).json({ success: `New Course ${newCourse.title} created!!!` })
    } catch (error) {
      next(error)
    }
  }

  getAllCourses = async (req, res, next) => {
    try {
      const courses = await Course.find()
      res.status(200).json({ courses: [...courses] })
    } catch (error) {
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

  updateCourseById = async (req, res, next) => {
    const courseId = req.params.courseId
    const updatedData = req.body
    console.log('updatedData: ', JSON.stringify(updatedData, 0, 2))
    try {
      const updatedCourse = await this.courseService.updateCourse(courseId, updatedData)
      res.status(200).json({ updated: updatedCourse.title })
    } catch (error) {
      console.log(error)
      next(error)
    }
  }

  getTest = async (req, res, next) => {
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
