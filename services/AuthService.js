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

  authUser = async (credentials) => {
    const { username, password } = credentials
    const foundUser = await this.getUserByCredentials(username, password)
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    )
    return { accessToken, refreshToken }
  }

  getNewAccessToken = async (cookies) => {
    if (!cookies?.jwt) throw new HttpException(401, 'Unauthorized')
    const refreshToken = cookies.jwt
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    const foundUser = await User.findOne({ username: decoded.username }).exec()
    if (!foundUser) throw new HttpException(401, 'Unauthorized')
    console.log('decoded: ', decoded)

    const refreshedToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles
        }
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    )
    return refreshedToken
  }

  getUserByCredentials = async (username, password) => {
    if (!username || !password) throw new HttpException(400, 'All fields are required')
    const foundUser = await User.findOne({ username }).exec()
    if (!foundUser || !foundUser.active) throw new HttpException(401, 'Unauthorized')
    const match = await bcrypt.compare(password, foundUser.password)
    if (!match) throw new HttpException(401, 'Unauthorized')
    return foundUser
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
