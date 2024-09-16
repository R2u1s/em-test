import { FORBIDDEN } from '../constants/constants.mjs';

class ErrorForbidden extends Error {
  constructor(message) {
    super(message);
    this.statusCode = FORBIDDEN;
  }
}

export default ErrorForbidden;
