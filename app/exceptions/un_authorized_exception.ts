import { Exception } from '@adonisjs/core/exceptions'

/**
 * Exception raised when a user is not authorized to perform an action.
 * Default status code is 403 (Forbidden).
 * You can override the default message by passing a custom message to the constructor.
 */
export default class UnAuthorizedException extends Exception {
  static status = 403
  static code = 'E_UNAUTHORIZED'
  static message = 'You are not authorized to perform this action'

  constructor(message?: string) {
    super(message || UnAuthorizedException.message, {
      status: UnAuthorizedException.status,
      code: UnAuthorizedException.code,
    })
  }
}
