import { UNAUTHORIZED } from '../constants/constants.mjs';

class ErrorUnauthorized extends Error {
  constructor(message) {
    super(message);
    this.statusCode = UNAUTHORIZED;
  }
}

export default ErrorUnauthorized;
