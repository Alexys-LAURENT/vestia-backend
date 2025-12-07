import User from '#models/user'
import { DateTime } from 'luxon'

export default class UsersRepository {
  async findUserByEmail(email: string) {
    const user = await User.findBy('email', email)
    return user
  }

  async findUserByUsername(username: string) {
    const user = await User.findBy('username', username)
    return user
  }

  async createUser(userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
    birthDate: DateTime
  }) {
    const user = await User.create(userData)
    return user
  }
}
