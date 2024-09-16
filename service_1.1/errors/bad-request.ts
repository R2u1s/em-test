import { BAD_REQUEST } from '../constants/constants';

class ErrorBadRequest extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = BAD_REQUEST;
  }
}

export default ErrorBadRequest;
