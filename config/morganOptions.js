const fs = require('fs')
const path = require('path')
const { format } = require('date-fns')

const accessLogStream = fs.createWriteStream(path.join(__dirname, '..', 'logs', 'access.log'), { flags: 'a' })

const logToConsoleAndFile = (message) => {
  console.log(message)
  accessLogStream.write(`${message}`)
}

const logFormat = (tokens, req, res) => {
  const timestamp = `${format(new Date(), 'dd-MM-yyyy  kk:mm:ss')}`
  return [
    timestamp,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time'](req, res), 'ms',
    tokens['user-agent'](req, res)
  ].join(' ')
}

module.exports = { logToConsoleAndFile, logFormat }
