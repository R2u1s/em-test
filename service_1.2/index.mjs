import express from 'express';
import helmet from 'helmet';
import limiter from './middlewares/limiter.mjs';
import cors from 'cors';
import pkg from 'pg';
import { config } from './utils/connection.mjs';
import morgan from 'morgan';
import ErrorNotFound from './errors/not-found.mjs';
import routerMain from './routes/main.mjs';
import errorHandler from './middlewares/error-handler.mjs';

const {Client} = pkg;

const port = process.env.PORT || 3001;
const client = new Client(config);

const app = express();

app.use(limiter); // ограничение количества запросов для защиты от DoS-атак
app.use(helmet()); // лечение основных веб-уязвимостей
app.use(morgan('combined')); // используем morgan для логирования входящих запросов
app.use(cors());
app.use(express.json());

app.use(routerMain);

app.use('*', (req, res, next) => { // обработка несуществующего роута
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