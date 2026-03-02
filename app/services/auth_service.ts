import UnAuthorizedException from '#exceptions/un_authorized_exception'
import User from '#models/user'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import UsersRepository from '../repositories/users_repository.js'

@inject()
export default class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    protected ctx: HttpContext
  ) {}

  async checkUserExistenceByEmailOrFail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email)
    if (!user) {
      throw new UnAuthorizedException('Invalid credentials')
    }
    return user
  }

  async checkUsernameAvailabilityOrFail(username: string) {
    const user = await this.usersRepository.findUserByUsername(username)
    if (user) {
      throw new UnAuthorizedException('Username is already taken')
    }
    return user
  }

  async checkEmailAvailabilityOrFail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email)
    if (user) {
      throw new UnAuthorizedException('Email is already taken')
    }
    return user
  }

  async checkUserPassword(user: User, password: string) {
    const doesPasswordMatch = await hash.verify(user.password, password)
    if (!doesPasswordMatch) {
      throw new UnAuthorizedException('Invalid credentials')
    }
  }

  async generateAccessTokenForUser(user: User) {
    const accessToken = await User.accessTokens.create(user)
    return accessToken
  }

  async logUserOut() {
    const user = this.ctx.auth.getUserOrFail()
    const token = user.currentAccessToken
    await User.accessTokens.delete(user, token.identifier)
  }

  async updateUserProfile(
    user: User,
    data: {
      firstName?: string
      lastName?: string
      username?: string
      birthDate?: Date
      email?: string
    }
  ) {
    if (data.username && data.username !== user.username) {
      await this.checkUsernameAvailabilityOrFail(data.username)
    }
    if (data.email && data.email !== user.email) {
      await this.checkEmailAvailabilityOrFail(data.email)
    }
    const updateData: Parameters<typeof this.usersRepository.updateUser>[1] = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      birthDate: data.birthDate ? DateTime.fromJSDate(data.birthDate) : undefined,
    }
    return this.usersRepository.updateUser(user, updateData)
  }

  async changeUserPassword(user: User, currentPassword: string, newPassword: string) {
    await this.checkUserPassword(user, currentPassword)
    return this.usersRepository.updateUser(user, { password: newPassword })
  }

  async registerUser(userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
    birthDate: Date
  }) {
    const birthDateDateTime = DateTime.fromJSDate(userData.birthDate)
    const user = await this.usersRepository.createUser({
      ...userData,
      birthDate: birthDateDateTime,
    })
    return user
  }
}
