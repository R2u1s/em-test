import { UNAUTHORIZED } from '../constants/constants';

class ErrorUnauthorized extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = UNAUTHORIZED;
  }
}

export default ErrorUnauthorized;
