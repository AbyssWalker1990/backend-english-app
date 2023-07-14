const rateLimit = require('express-rate-limit')
const { logToConsoleAndFile } = require('../config/morganOptions')

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: 'Too many login attempts, please try again after 60 seconds'
  },
  handler: (req, res, next, options) => {
    logToConsoleAndFile(`Too many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`)
    res.status(options.statusCode).send(options.message)
  },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = loginLimiter
