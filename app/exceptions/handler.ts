import { errors as authErrors } from '@adonisjs/auth'
import { errors as adonisErrors } from '@adonisjs/core'
import { ExceptionHandler, HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'
import ClientAccessibleException from './client_accessible_exception.js'
import UnAuthorizedException from './un_authorized_exception.js'
export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      let shouldIncludeExists = false
      if (error.messages && Array.isArray(error.messages)) {
        shouldIncludeExists = error.messages.some((msg) => msg.rule === 'database.exists')
      }

      ctx.response.status(error.status).send({
        error: true,
        ...(shouldIncludeExists ? { exists: false } : {}),
        validation: error.messages,
      })
      return
    }

    if (error instanceof UnAuthorizedException) {
      ctx.response.status(error.status).send({
        error: true,
        message: error.message,
      })
      return
    }

    if (error instanceof ClientAccessibleException) {
      ctx.response.status(error.status).send({
        error: true,
        message: error.message,
      })
      return
    }

    if (error instanceof adonisErrors.E_ROUTE_NOT_FOUND) {
      ctx.response.status(404).send({
        error: true,
        message: 'Route not found',
      })
      return
    }

    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      ctx.response.status(404).send({
        error: true,
        exists: false,
        message: 'Resource not found',
      })
      return
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      ctx.response.status(401).send({
        error: true,
        message: 'Unauthorized access',
      })
      return
    }

    const status =
      error && typeof error === 'object' && 'status' in error ? (error as any).status : 500

    ctx.response.status(status).send({
      error: true,
      message: 'An error occurred',
    })
    return
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Log the error using the LogsService
    return super.report(error, ctx)
  }
}
