import { NOT_FOUND } from '../constants/constants.mjs';

class ErrorNotFound extends Error {
  constructor(message) {
    super(message);
    this.statusCode = NOT_FOUND;
  }
}

export default ErrorNotFound;
