import { INTERNAL_SERVER_ERROR } from '../constants/constants.mjs';

class ErrorInternalServer extends Error {
  constructor(message) {
    super(message);
    this.statusCode = INTERNAL_SERVER_ERROR;
  }
}

export default ErrorInternalServer;
