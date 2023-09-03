/* eslint-disable no-undef */
const { describe, expect, test } = require('@jest/globals')
const AuthService = require('../services/AuthService')
const HttpException = require('../exceptions/HttpException')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const { Query } = require('mongoose')

describe('AuthService', () => {
  beforeEach(() => {
    properRegisterInput = {
      username: 'username',
      password: 'password',
      email: 'bordiian@mail.com',
      roles: ['User']
    }

    notFullRegisterInput = {
      username: 'username',
      password: 'password',
      roles: ['User']
    }

    properRegisterOutput = {
      username: 'testTest',
      email: 'bordsdfiisdfan.v@gmail.com',
      password: '$2b$10$S25xDQIs2caQhigZcsc7C.m8ZVc0EamDzU6VYyemjbqAcGEOvaF3O',
      roles: [
        'User'
      ],
      active: true,
      profile: {
        courses: [],
        coursesAnswers: []
      }
    }

    authService = new AuthService()
  })

  describe('createNewUser', () => {
    test('Returns username of created user', async () => {
      jest.spyOn(authService, 'isDuplicate').mockResolvedValue(true)
      jest.spyOn(User, 'create').mockResolvedValueOnce(properRegisterOutput)
      const result = await authService.createNewUser(properRegisterInput)
      expect(result).toStrictEqual(properRegisterOutput)
    })
    test('Return Error when register input is not full', async () => {
      await expect(authService.createNewUser(notFullRegisterInput)).rejects
        .toThrow(new HttpException(400, 'All fields are required'))
    })
  })

  describe('getUserByCredentials', () => {
    beforeEach(() => {
      username = 'username'
      password = 'password'
    })

    test('Returns user object if credentials right', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce(properRegisterOutput)
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true)
      const result = await authService.getUserByCredentials(username, password)
      expect(result).toStrictEqual(properRegisterOutput)
    })
  })
})
