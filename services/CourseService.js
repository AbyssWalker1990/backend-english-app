const initialCourseData = require('../config/initialCourseData')
const HttpException = require('../exceptions/HttpException')
const Course = require('../models/Course')

class CourseService {
  addNewCourse = async () => {
    const { description, lessons } = initialCourseData

    const newCourse = await Course.create({
      title: Math.random(),
      description,
      lessons: [...lessons]
    })
    return newCourse
  }

  updateCourse = async (courseId, updatedData) => {
    try {
      let updatedCourse = await Course.findById(courseId).exec()
      updatedCourse = {
        title: updatedCourse.title,
        description: updatedCourse.description,
        lessons: updatedCourse.lessons,
        ...updatedData
      }
      await Course.findByIdAndUpdate(courseId, updatedCourse)
      return updatedCourse
    } catch (error) {
      if (error.name === 'CastError') {
        throw new HttpException(500, 'Invalid course id')
      } else {
        throw error
      }
    }
  }
}

module.exports = CourseService
