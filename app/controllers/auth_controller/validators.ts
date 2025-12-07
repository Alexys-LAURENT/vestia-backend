import vine from '@vinejs/vine'
import { PASSWORD_REGEX } from '../../../constants/auth_constants.ts.js'

export const registerUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().escape(),
    username: vine.string().minLength(3).trim().escape(),
    password: vine.string().minLength(6).trim().escape().regex(PASSWORD_REGEX),
    firstName: vine.string().trim().escape(),
    lastName: vine.string().trim().escape(),
    birthDate: vine.date(),
  })
)

export const loginUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().escape(),
    password: vine.string().minLength(6).trim().escape().regex(PASSWORD_REGEX),
  })
)
