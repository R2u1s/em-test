import { NextFunction, Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR } from '../constants/constants';

const errorHandler = (err:any, req: Request, res: Response, next: NextFunction) => {
  // если у ошибки нет статуса, выставляем 500
  console.log(err);
  const { statusCode = INTERNAL_SERVER_ERROR, message } = err;
  res
    .status(statusCode)
    .send({
      // проверяем статус и выставляем сообщение в зависимости от него
      message: statusCode === INTERNAL_SERVER_ERROR
        ? 'На сервере произошла ошибка'
        : message,
    });
  next();
};

export default errorHandler;
