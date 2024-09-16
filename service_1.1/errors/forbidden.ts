import { FORBIDDEN } from '../constants/constants';

class ErrorForbidden extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = FORBIDDEN;
  }
}

export default ErrorForbidden;
