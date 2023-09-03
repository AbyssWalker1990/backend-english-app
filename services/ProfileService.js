const User = require('../models/User')
const Course = require('../models/Course')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const s3Config = require('../config/s3Config')
const HttpException = require('../exceptions/HttpException')

class ProfileService {
  setProfileData = async (username, profileData) => {
    const { course, objectives, priorities, hobbies } = profileData
    const currentUser = await User.findOne({ username })
    const currentCourse = await Course.findOne({ title: course })
    console.log('currentCourse: ', currentCourse)
    const updatedObjectives = this.formatProfileData(objectives)
    const updatedPriorities = this.formatProfileData(priorities)
    const updatedHobbies = this.formatProfileData(hobbies)
    currentUser.profile.objectives = updatedObjectives
    currentUser.profile.priorities = updatedPriorities
    currentUser.profile.hobbies = updatedHobbies
    currentUser.profile.activeCourse = course
    if (!currentUser.profile.courses.includes(course)) {
      currentUser.profile.courses = [...currentUser.profile.courses, course]
    }
    await currentUser.save()
    if (!currentUser.profile.coursesAnswers.find((answer) => answer.courseId === currentCourse._id)) {
      await this.setInitAnswers(currentCourse._id.toString(), username)
    }
    return true
  }

  setProfileActiveCourse = async (courseTitle, username) => {
    const currentUser = await User.findOne({ username })
    currentUser.profile.courses.push(courseTitle)
    currentUser.profile.activeCourse = courseTitle
    await currentUser.save()
  }

  uploadAndSetPhoto = async (username, photo) => {
    const s3Client = new S3Client(s3Config)
    const currentUser = await User.findOne({ username })

    const formattedName = this.generatePhotoName(photo)

    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: formattedName,
      Body: photo.buffer
    }
    await s3Client.send(new PutObjectCommand(bucketParams))
    currentUser.profile.photo = `https://english-learn-app.s3.eu-central-1.amazonaws.com/${formattedName}`
    await currentUser.save()

    return true
  }

  updateAnswers = async (username, answersData) => {
    console.log('trigger updateAnswers')
    const { courseId, lessonPosition, blockPosition, exerciseAnswers } = answersData
    const currentUser = await User.findOne({ username })
    if (currentUser.profile.coursesAnswers.find((answer) => answer.courseId === courseId) === undefined) {
      await this.setInitAnswers(courseId, username)
    }

    try {
      const currentUser3 = await User.findOne({ username })
      console.log(exerciseAnswers)
      console.log(Array.isArray(exerciseAnswers))

      if (
        currentUser3.profile.coursesAnswers
          .find((course) => course.courseId === courseId)
          .lessons.find((lesson) => lesson.lessonPosition === lessonPosition) === undefined
      ) {
        currentUser3.profile.coursesAnswers
          .find((course) => course.courseId === courseId)
          .lessons.push({
            lessonPosition
          })
      }

      if (
        currentUser3.profile.coursesAnswers
          .find((course) => course.courseId === courseId)
          .lessons.find((lesson) => lesson.lessonPosition === lessonPosition)
          .exercisesBlocks.find((block) => block.blockPosition === blockPosition) !== undefined
      ) {
        currentUser3.profile.coursesAnswers
          .find((course) => course.courseId === courseId)
          .lessons.find((lesson) => lesson.lessonPosition === lessonPosition)
          .exercisesBlocks.find((block) => block.blockPosition === blockPosition).blockExercises = exerciseAnswers
        currentUser3.save()
      } else {
        const newBlock = { blockPosition, blockExercises: exerciseAnswers }
        currentUser3.profile.coursesAnswers
          .find((course) => course.courseId === courseId)
          .lessons.find((lesson) => lesson.lessonPosition === lessonPosition)
          .exercisesBlocks.push(newBlock)
        currentUser3.save()
      }
    } catch (error) {
      console.log('Error from received data: ', error)
    }
  }

  updateResult = async (username, lessonData) => {
    const currentUser = await User.findOne({ username }).exec()
    const { courseId, lessonPos } = lessonData
    const curLesson = await this.getLessonByPosition(courseId, lessonPos)
    const curLessonAnswers = await this.getLessonAnswersByPosition(courseId, lessonPos, currentUser)
    const blankAnswers = this.generateBlankLessonResult(curLessonAnswers)
    const lessonResult = this.calculateAndAddLessonResults(blankAnswers, curLesson)

    if (
      currentUser.profile.coursesAnswers.find((answers) => answers.courseId === courseId).courseResults === undefined
    ) {
      currentUser.profile.coursesAnswers.find((answers) => answers.courseId === courseId).courseResults = []
    }

    const resultsWithoutPrevios = currentUser.profile.coursesAnswers
      .find((answers) => answers.courseId === courseId)
      .courseResults.filter((result) => {
        return result.lessonPosition !== Number(lessonPos)
      })

    currentUser.profile.coursesAnswers.find((answers) => answers.courseId === courseId).courseResults = [
      ...resultsWithoutPrevios,
      lessonResult
    ]
    await currentUser.save()
    return curLesson
  }

  getLessonByPosition = async (courseId, lessonPos) => {
    const curCourse = await Course.findById(courseId).exec()
    const curLesson = curCourse.lessons.find((lesson) => lesson.lessonPosition === Number(lessonPos))
    return curLesson
  }

  getLessonAnswersByPosition = async (courseId, lessonPos, currentUser) => {
    const courseAnswers = await currentUser.profile.coursesAnswers.find((course) => course.courseId === courseId)
    const lessonAnswers = courseAnswers.lessons.find((lesson) => lesson.lessonPosition === Number(lessonPos))
    return lessonAnswers
  }

  generateBlankLessonResult = (curLessonAnswers) => {
    let blankLessonResult = JSON.parse(JSON.stringify(curLessonAnswers))
    blankLessonResult = {
      ...blankLessonResult,
      lessonResultPercent: 0,
      lessonResultRight: 0,
      lessonResultWrong: 0
    }
    return blankLessonResult
  }

  calculateAndAddLessonResults = (lessonResult, curLesson) => {
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
      block.blockResultPercent = (block.blockResultRight / block.blockExercises.length) * 100
    })
    lessonResult.lessonResultRight = lessonResultRight
    lessonResult.lessonResultWrong = lessonResultWrong
    lessonResult.lessonResultPercent = (lessonResultRight / exerciseCount) * 100
    return lessonResult
  }

  generatePhotoName = (photo) => {
    const ext = photo.mimetype.split('/')[1]
    const name = photo.originalname.split('.')[0]
    return `${name}-${new Date().getTime()}.${ext}`
  }

  setInitAnswers = async (courseId, username) => {
    console.log('courseId: ', courseId)
    const currentUser = await User.findOne({ username })
    const currentCourse = await Course.findById(courseId).exec()
    if (!currentUser.coursesAnswers) {
      currentUser.coursesAnswers = []
      await currentUser.save()
    }
    if (currentUser.profile.coursesAnswers.find((answer) => answer.courseId === courseId) === undefined) {
      const lessonAnswersData = this.buildCourseAnswersStucture(currentCourse)

      const courseAnswerData = {
        courseId,
        lessons: lessonAnswersData
      }
      try {
        const currentUser2 = await User.findOne({ username })
        currentUser2.profile.coursesAnswers = [...currentUser.coursesAnswers, courseAnswerData]
        console.log('currentUser2: ', currentUser2)
        await currentUser2.save()
      } catch (error) {
        console.log('EXACTLY THIS ERROR')
        throw new HttpException(500, error.message)
      }
    }
  }

  buildCourseAnswersStucture = (course) => {
    const lessonAnswersData = course.lessons.map((lesson) => {
      return { lessonPosition: lesson.lessonPosition }
    })
    lessonAnswersData.forEach((lesson) => {
      const curLesson = course.lessons.find((courseLesson) => courseLesson.lessonPosition === lesson.lessonPosition)
      lesson.exercisesBlocks = curLesson.exercisesBlocks.map((block) => {
        return {
          blockPosition: block.blockPosition,
          blockExercises: curLesson.exercisesBlocks[block.blockPosition - 1].blockExercises.map((exercise) => ({
            exercisePos: exercise.exercisePos
          }))
        }
      })
    })
    return lessonAnswersData
  }

  formatProfileData = (data) => {
    const dataArray = data.split(',').map((el) => {
      console.log(el)
      el.trim()
      if (el.length > 0) el[0].toUpperCase()
      return el
    })
    const withoutEmpty = dataArray.filter((el) => el.length > 0 && !/^ +$/.test(el))
    return withoutEmpty
  }
}

module.exports = ProfileService
