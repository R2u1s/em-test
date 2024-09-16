import { BAD_REQUEST } from '../constants/constants.mjs';

class ErrorBadRequest extends Error {
  constructor(message) {
    super(message);
    this.statusCode = BAD_REQUEST;
  }
}

export default ErrorBadRequest;
