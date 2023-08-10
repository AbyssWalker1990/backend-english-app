const HttpException = require('../exceptions/HttpException')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

class AuthService {
  createNewUser = async (newUserData) => {
    const { username, password, roles, email } = newUserData
    const currentRoles = roles ?? ['User']

    this.isFullRegisterData(username, password, email, roles)
    await this.isDuplicate(username, 'username')
    await this.isDuplicate(email, 'email')

    const hashedPwd = await bcrypt.hash(password, 10)
    const userObject = { username, password: hashedPwd, email, roles: currentRoles }
    const user = await User.create(userObject)

    return user
  }

  isFullRegisterData = (username, password, email, roles) => {
    if (!username || !password || !email || !Array.isArray(roles) || !roles.length) {
      throw new HttpException(400, 'All fields are required')
    }
  }

  isDuplicate = async (fieldData, fieldName) => {
    const user = await User.findOne({ [fieldName]: fieldData }).lean().exec()
    if (user) throw new HttpException(409, `Duplicate ${fieldName}`)
  }
}

module.exports = AuthService
