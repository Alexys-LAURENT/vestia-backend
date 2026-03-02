/* eslint-disable @typescript-eslint/naming-convention */
import AuthService from '#services/auth_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AbstractController from '../abstract_controller.js'
import {
  changePasswordValidator,
  loginUserValidator,
  registerUserValidator,
  updateProfileValidator,
} from './validators.js'

@inject()
export default class AuthController extends AbstractController {
  constructor(private authService: AuthService) {
    super()
  }

  public async login({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginUserValidator)

    const user = await this.authService.checkUserExistenceByEmailOrFail(email)

    await this.authService.checkUserPassword(user, password)

    const access_token = await this.authService.generateAccessTokenForUser(user)

    return this.buildJSONResponse({
      data: {
        idUser: user.idUser,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.$attributes.email,
        birthDate: user.birthDate,
        accessToken: {
          type: 'Bearer',
          token: access_token.value?.release(),
          expiresAt: access_token.expiresAt,
        },
      },
    })
  }

  public async logout() {
    await this.authService.logUserOut()
    return this.buildJSONResponse({ message: 'Logged out successfully' })
  }

  public async register({ request }: HttpContext) {
    const valid = await registerUserValidator.validate(request.body())

    await Promise.all([
      this.authService.checkEmailAvailabilityOrFail(valid.email),
      this.authService.checkUsernameAvailabilityOrFail(valid.username),
    ])

    await this.authService.registerUser(valid)

    return this.buildJSONResponse({ message: 'User registered successfully' })
  }

  public async updateProfile({ auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const data = await request.validateUsing(updateProfileValidator)

    const updatedUser = await this.authService.updateUserProfile(user, data)

    return this.buildJSONResponse({
      message: 'Profil mis à jour avec succès',
      data: {
        idUser: updatedUser.idUser,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        birthDate: updatedUser.birthDate,
      },
    })
  }

  public async changePassword({ auth, request }: HttpContext) {
    const user = await auth.authenticate()
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)

    await this.authService.changeUserPassword(user, currentPassword, newPassword)

    return this.buildJSONResponse({ message: 'Mot de passe modifié avec succès' })
  }

  public async checkUsername({ request }: HttpContext) {
    const { username } = request.body()
    await this.authService.checkUsernameAvailabilityOrFail(username)
    return this.buildJSONResponse({ message: 'Username is available' })
  }
}
