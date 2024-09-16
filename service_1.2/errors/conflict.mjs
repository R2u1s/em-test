import { CONFLICT } from '../constants/constants.mjs';

class ErrorConflict extends Error {
  constructor(message) {
    super(message);
    this.statusCode = CONFLICT;
  }
}

export default ErrorConflict;
