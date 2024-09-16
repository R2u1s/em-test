import { NextFunction, Request, Response } from 'express';
import { pool } from '../utils/connection';
import ErrorBadRequest from '../errors/bad-request';
import ErrorForbidden from '../errors/forbidden';
import { isPositiveInteger } from '../utils/utils';
import { client } from '../utils/connection';
import { Action, Table } from '../types/types';
import { sendChanges } from '../helpers/helpers';

//создание остатка товара в таблице stock
export const createStock = async (req: Request, res: Response, next: NextFunction) => {

  const { plu, shop_id, qty } = req.body;

  // Проверка существования остатка товара в таблице stock
  const productQtyCheck = await pool.query(`
    SELECT plu FROM stock WHERE plu = $1 AND shop_id = $2`, [plu, shop_id]);

  if (productQtyCheck.rows.length > 0) {
    return next(new ErrorBadRequest('В системе уже есть запись о остатке товара в указанном магазине'));
  } else {
    // Если запись не найдена смотрим есть ли такой товар в таблице products
    const productCheck = await pool.query('SELECT $1 FROM products WHERE plu = $1', [plu]);

    if (productCheck.rowCount === 0) {
      return next(new ErrorBadRequest('В системе нет товара с таким артикулом. Сначала создайте товар'));
    }
  }

  // Проверяем является ли amount положительным, целочисленным числом
  if (!isPositiveInteger(qty)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  }

  // // (не актуально, но вдруг)Если в таблице уже записан остаток для этого товара для заданного магазина, то количество обновится
  // let query = `
  //   INSERT INTO stock (plu, shop_id, qty)
  //   VALUES ($1, $2, $3)
  //   ON CONFLICT (plu, shop_id)
  //   DO UPDATE SET qty = $3
  //   RETURNING *;
  // `;

  let query = `
    INSERT INTO stock (plu, shop_id, qty)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [plu, shop_id, qty];

  try {
    //транзакция нужна поскольку помимо создания остатка делается запрос логирования
    await client.query('BEGIN');
    const products = await pool.query(query, values);

    //отправляем лог в таблицу изменений
    await sendChanges(Action.CREATE, Table.STOCK, [plu, shop_id, qty], next);

    res.status(201).json(products.rows[0]);
  } catch (error) {
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//увеличение остатка товара на полке указанного магазина
export const increaseStock = async (req: Request, res: Response, next: NextFunction) => {

  const { plu, shop_id, amount } = req.body;

  // Проверка существования остатка товара в таблице stock
  const productCheckResult = await pool.query(`
  SELECT plu,shop_id,qty FROM stock WHERE plu = $1 AND shop_id = $2`, [plu, shop_id]);

  if (productCheckResult.rowCount === 0) {
    return next(new ErrorBadRequest('В системе нет записи о количестве товара в указанном магазине с таким артикулом'));
  }

  // Проверяем является ли amount положительным, целочисленным числом
  if (!isPositiveInteger(amount)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  }

  let query = `
    UPDATE stock
    SET qty = qty + $2
    WHERE plu = $1
    RETURNING *;
  `;

  try {
    //транзакция нужна поскольку помимо создания продукта делается запрос логирования
    await client.query('BEGIN');

    const products = await pool.query(query, [plu, amount]);

    //отправляем лог в таблицу изменений
    const qty_old = productCheckResult.rows[0].qty;
    const qty_new = products.rows[0].qty;
    await sendChanges(Action.UPDATE,Table.STOCK,[plu,shop_id,qty_old,qty_new],next);

    res.status(200).json(products.rows[0]);
  } catch (error: unknown) {
    if (error instanceof Error && (error as any).code === '23505') {
      next(new ErrorForbidden('Товар с таким артикулом уже существует'));
    }
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//уменьшение остатка товара на полке указанного магазина
export const decreaseStock = async (req: Request, res: Response, next: NextFunction) => {

  const { plu, shop_id, amount } = req.body;

  // Проверка существования остатка товара в таблице stock
  const productCheckResult = await pool.query(`
  SELECT plu,qty FROM stock WHERE plu = $1 AND shop_id = $2`, [plu, shop_id]);

  if (productCheckResult.rowCount === 0) {
    return next(new ErrorBadRequest('В системе нет записи о количестве товара в указанном магазине с таким артикулом'));
  }

  if (!isPositiveInteger(amount)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  } else if (amount > productCheckResult.rows[0].qty) {
    return next(new ErrorForbidden('Количество товара слишком мало, чтобы уменьшить на указанную величину'));
  }

  let query = `
    UPDATE stock
    SET qty = qty - $2
    WHERE plu = $1
    RETURNING *;
  `;

  try {
    //транзакция нужна поскольку помимо создания продукта делается запрос логирования
    await client.query('BEGIN');

    const products = await pool.query(query, [plu, amount]);

    //отправляем лог в таблицу изменений
    const qty_old = productCheckResult.rows[0].qty;
    const qty_new = products.rows[0].qty;
    await sendChanges(Action.UPDATE,Table.STOCK,[plu,shop_id,qty_old,qty_new],next);
    
    res.status(200).json(products.rows[0]);
  } catch (error: unknown) {
    if (error instanceof Error && (error as any).code === '23505') {
      next(new ErrorForbidden('Товар с таким артикулом уже существует'));
    }
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//получение остатков с фильтрами
export const getStock = async (req: Request, res: Response, next: NextFunction) => {

  const { shop_id, plu, prefix, from, to } = req.query;

  let query = 'SELECT * FROM stock';
  let values: string[] = [];
  let index = 1;

  //проверяем, если shop_id адекватно задан, то добавляем его в параметры запроса
  if (shop_id && typeof shop_id === 'string') {
    query += ' WHERE shop_id ILIKE $1';
    values.push(`%${shop_id}%`);
    index++;
  }

  //проверяем, если plu адекватно задан, то добавляем его в параметры запроса
  //можно сделать фильтр по префиксу артикула plu, который обозначает
  //какие-либо параметры товара (к примеру органическое выращивание или ГМО)
  //для фильтра по префиксу проверяем является ли plu 5-ти значным
  if (prefix && typeof prefix === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}plu ~ '^[0-9]{5}$' AND LEFT(plu, 1) = $${index}::text`;
    values.push(prefix);
    index++;
  } else if (plu && typeof plu === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}plu = $${index}::text`;
    values.push(plu);
    index++;
  }

  //добавляем к запросу фильтры по количеству
  if (from && typeof from === 'string' && to && typeof to === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}qty >= $${index} AND qty <= $${index + 1}`;
    values.push(from, to);
  } else if (from && typeof from === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}qty >= $${index}`;
    values.push(from);
  } else if (to && typeof to === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}qty <= $${index}`;
    values.push(to);
  }

  try {
    const products = await pool.query(query, values);
    if (products.rowCount !== 0) {
      res.status(200).json(products.rows);
    } else {
      next(new ErrorBadRequest('Товары не найдены для заданных условий'));
    }
  } catch (error: unknown) {
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}