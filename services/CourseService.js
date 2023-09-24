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

  transformCardsToArray = (cards) => {
    const rawCards = cards.split(';')
    const filteredRawCards = rawCards.filter((card) => card.trim().length > 0)
    const transformedCards = filteredRawCards.map((card) => {
      card.trim()
      const splittedCard = card.split(':')
      const trimmedWords = splittedCard.map((word) => word.trim())
      return {
        english: trimmedWords[0],
        ukrainian: trimmedWords[1]
      }
    })
    return transformedCards
  }

  updateCardsByLessonPos = async (courseId, lessonPos, cards) => {
    try {
      const currentCourse = await Course.findById(courseId)
      currentCourse.lessons.find((lesson) => lesson.lessonPosition === Number(lessonPos)).wordCards = cards
      await currentCourse.save()
    } catch (error) {
      throw new Error(error)
    }
  }
}

module.exports = CourseService
