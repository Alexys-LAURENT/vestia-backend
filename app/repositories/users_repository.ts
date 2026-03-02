import User from '#models/user'
import { DateTime } from 'luxon'

type UpdateUserData = {
  firstName?: string
  lastName?: string
  username?: string
  birthDate?: DateTime
  email?: string
  password?: string
}

export default class UsersRepository {
  async findUserByEmail(email: string) {
    const user = await User.findBy('email', email)
    return user
  }

  async findUserByUsername(username: string) {
    const user = await User.findBy('username', username)
    return user
  }

  async updateUser(user: User, data: UpdateUserData) {
    user.merge(data)
    await user.save()
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
