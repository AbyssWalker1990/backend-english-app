const initialCourseData = require('../config/initialCourseData')
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
}

module.exports = CourseService
