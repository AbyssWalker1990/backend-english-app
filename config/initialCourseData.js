const initialCourseData = {
  title: 'New Created Course!',
  description: 'Placeholder for description',
  lessons: [
    {
      lessonTitle: 'First Lesson',
      lessonPosition: 1,
      lessonDescription: 'Lesson Description here',
      lessonExercises: [
        {
          exercisePos: 1,
          exerciseType: 'quiz',
          exerciseDescription: 'Description for first exercise.',
          exerciseQuizAnswers: [
            'Answer 1',
            'Answer 2',
            'Answer 3',
            'Answer 4'
          ],
          correctAnswer: 'Answer 3'
        },
        {
          exercisePos: 2,
          exerciseType: 'quiz',
          exerciseDescription: 'Description for second exercise. There are too many words',
          exerciseQuizAnswers: [
            'Answer 1',
            'Answer 2',
            'Answer 3',
            'Answer 4'
          ],
          correctAnswer: 'Answer 1'
        },
        {
          exercisePos: 1,
          exerciseType: 'quiz',
          exerciseDescription: 'Description for third exercise. There are too many words',
          exerciseQuizAnswers: [
            'Answer 1',
            'Answer 2',
            'Answer 3',
            'Answer 4'
          ],
          correctAnswer: 'Answer 2'
        }
      ]
    }
  ]
}

module.exports = initialCourseData
