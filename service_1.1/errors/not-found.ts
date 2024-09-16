import { NOT_FOUND } from '../constants/constants';

class ErrorNotFound extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = NOT_FOUND;
  }
}

export default ErrorNotFound;
