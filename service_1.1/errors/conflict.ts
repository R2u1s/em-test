import { CONFLICT } from '../constants/constants';

class ErrorConflict extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = CONFLICT;
  }
}

export default ErrorConflict;
