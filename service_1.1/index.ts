import express, { NextFunction } from 'express';
import helmet from 'helmet';
import limiter from './middlewares/limiter';
import cors from 'cors';
import morgan from 'morgan';
import ErrorNotFound from './errors/not-found';
import routerProduct from './routes/products';
import routerStock from './routes/stock';
import routerOrder from './routes/orders';
import errorHandler from './middlewares/error-handler';
import { client } from './utils/connection';

const port = process.env.PORT || 3001;

const app = express();

app.use(limiter); // ограничение количества запросов для защиты от DoS-атак
app.use(helmet()); // лечение основных веб-уязвимостей
app.use(morgan('combined')); // используем morgan для логирования входящих запросов
app.use(cors());
app.use(express.json());

app.use('/products',routerProduct); //роутер для действий с таблицей продуктов
app.use('/stock',routerStock); //роутер для действий с таблицей остатков на полке
app.use('/orders',routerOrder); //роутер для действий с таблицей заказов

app.use('*', (req, res, next: NextFunction) => { // обработка несуществующего роута
  next(new ErrorNotFound('Страница не найдена'));
});
app.use(errorHandler); // обработчик ошибок
async function connect() {
  try {
    await client.connect();
    console.log('Connected to DB');
    app.listen(port);
    console.log(`Server start on port: ${port}`);
  } catch (err) {
    console.log('Error on the server side', err);
  }
}

connect();