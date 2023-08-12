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
    currentUser.profile.objectives = objectives
    currentUser.profile.priorities = priorities
    currentUser.profile.hobbies = hobbies
    currentUser.profile.activeCourse = course
    if (!currentUser.profile.courses.includes(course)) {
      currentUser.profile.courses = [...currentUser.profile.courses, course]
    }
    await currentUser.save()
    if (!currentUser.profile.coursesAnswers.find(answer => answer.courseId === currentCourse._id)) {
      await this.setInitAnswers(currentCourse._id.toString(), username)
    }
    return true
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

  generatePhotoName = (photo) => {
    const ext = photo.mimetype.split('/')[1]
    const name = photo.originalname.split('.')[0]
    return `${name}-${new Date().getTime()}.${ext}`
  }

  setInitAnswers = async (courseId, username) => {
    const currentUser = await User.findOne({ username })
    const currentCourse = await Course.findById(courseId).exec()
    if (!currentUser.coursesAnswers) {
      currentUser.coursesAnswers = []
      currentUser.save()
    }
    if (currentUser.profile.coursesAnswers.find(answer => answer.courseId === courseId) === undefined) {
      const lessonAnswersData = this.buildCourseAnswersStucture(currentCourse)

      const courseAnswerData = {
        courseId,
        lessons: lessonAnswersData
      }
      try {
        const currentUser2 = await User.findOne({ username })
        currentUser2.profile.coursesAnswers = [...currentUser.coursesAnswers, courseAnswerData]
        await currentUser2.save()
      } catch (error) {
        throw new HttpException(500, error.message)
      }
    }
  }

  buildCourseAnswersStucture = (course) => {
    console.log('Triggered buildCourseAnswersStucture')
    const lessonAnswersData = course.lessons.map(lesson => {
      return { lessonPosition: lesson.lessonPosition }
    })
    lessonAnswersData.forEach(lesson => {
      const curLesson = course.lessons.find(courseLesson => courseLesson.lessonPosition === lesson.lessonPosition)
      lesson.exercisesBlocks = curLesson.exercisesBlocks.map(block => {
        return {
          blockPosition: block.blockPosition,
          blockExercises: curLesson.exercisesBlocks[block.blockPosition - 1].blockExercises.map(exercise => ({ exercisePos: exercise.exercisePos }))
        }
      })
    })
    return lessonAnswersData
  }
}

module.exports = ProfileService
