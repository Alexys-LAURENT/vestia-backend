import { Exception } from '@adonisjs/core/exceptions'

/**
 * Exception raised when a user is not authorized to perform an action.
 * This exception is safe to be shown to clients.
 * Default status code is 400 (Bad Request).
 * You can override the default message by passing a custom message to the constructor.
 */
export default class ClientAccessibleException extends Exception {
  static status = 400
  static code = 'E_CLIENT_ACCESSIBLE'
  static message = 'An error occurred'

  constructor(message?: string, status?: number) {
    super(message || ClientAccessibleException.message, {
      status: status || ClientAccessibleException.status,
      code: ClientAccessibleException.code,
    })
  }
}
