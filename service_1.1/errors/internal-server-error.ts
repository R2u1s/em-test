import { INTERNAL_SERVER_ERROR } from '../constants/constants';

class ErrorInternalServer extends Error {
  statusCode: number;

  constructor(message:string) {
    super(message);
    this.statusCode = INTERNAL_SERVER_ERROR;
  }
}

export default ErrorInternalServer;
