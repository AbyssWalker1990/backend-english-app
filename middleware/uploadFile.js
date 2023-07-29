const uploadFile = (req, res, next) => {
  // console.log('uploadFile: ', req.headers)
  req.headers['content-type'] = 'multipart/form-data; boundary=???'
  next()
}

module.exports = uploadFile
