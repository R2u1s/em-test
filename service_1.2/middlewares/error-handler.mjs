import { INTERNAL_SERVER_ERROR } from '../constants/constants.mjs';

const errorHandler = (err, req, res, next) => {
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
