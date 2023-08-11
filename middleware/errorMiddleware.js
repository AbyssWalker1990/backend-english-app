const { logToConsoleAndFile } = require('../config/morganOptions')

function errorMiddleware (err, req, res, next) {
  const status = err.status ?? 500
  const message = err.message
  logToConsoleAndFile(message)
  return res.status(status).json({ status, message })
}

module.exports = errorMiddleware
