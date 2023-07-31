const multer = require('multer')

// const upload = multer({
//   dest: 'uploads/',
//   filename: (req, file, callback) => {
//     callback(null, file.originalname)
//   }
// })

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1]
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`)
  }
})

const memStorage = multer.memoryStorage()

const upload = multer({
  storage: memStorage
})

module.exports = upload
