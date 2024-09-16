import { NextFunction, Request, Response } from 'express';
import { pool } from '../utils/connection';
import ErrorBadRequest from '../errors/bad-request';
import ErrorForbidden from '../errors/forbidden';
import { isPositiveInteger } from '../utils/utils';
import { client } from '../utils/connection';
import { sendChanges } from '../helpers/helpers';
import { Action, Table } from '../types/types';

//создание заказа в таблице orders
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {

  const { plu, shop_id, qty } = req.body;

  // Проверяем является ли amount положительным, целочисленным числом
  if (!isPositiveInteger(qty)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  }

  // Проверка существования остатка товара в таблице stock
  const stockCheck = await pool.query(`
    SELECT plu,qty FROM stock WHERE plu = $1 AND shop_id = $2`, [plu, shop_id]);

  if (stockCheck.rowCount === 0) {
    return next(new ErrorBadRequest('В системе нет записи о количестве товара в указанном магазине с таким артикулом'));
  } else if (stockCheck.rows[0] && stockCheck.rows[0].qty < qty) {
    return next(new ErrorForbidden('Недостаточное количество товара для оформления заказа'));
  }

  // Запрос на создание заказа
  const values = [plu, shop_id, qty];
  const query_create = `
    INSERT INTO orders (plu, shop_id, qty)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const query_decrease_stock = `
    UPDATE stock
    SET qty = qty - $3
    WHERE plu = $1 AND shop_id = $2
    RETURNING *;
  `;

  try {
    await client.query('BEGIN');
    const newOrder = await pool.query(query_create, values);

    if (newOrder.rowCount !== 0) {
      const newStock = await pool.query(query_decrease_stock, values);
      if (newStock.rowCount !== 0) {
        res.status(201).json(newOrder.rows[0]);

        //отправляем лог в таблицу изменений
        const order_id = newOrder.rows[0].id;
        await sendChanges(Action.CREATE, Table.ORDERS, [plu, shop_id, qty, order_id], next);

        await client.query('COMMIT');
      } else {
        await client.query('ROLLBACK');
        next(new ErrorBadRequest('Не удалось создать заказ'));
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//увеличение количества товара в заказе
export const increaseOrders = async (req: Request, res: Response, next: NextFunction) => {

  const { id, amount } = req.body;

  // Проверка существования остатка товара в таблице orders
  const orderCheck = await pool.query(`
  SELECT id, plu, shop_id, qty FROM orders WHERE id = $1`, [id]);

  if (orderCheck.rowCount === 0) {
    return next(new ErrorBadRequest('Заказ с указанным id не найден'));
  }

  // Проверяем является ли amount положительным, целочисленным числом
  if (!isPositiveInteger(amount)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  }

  // Проверяем остаток товара в магазине
  const stockCheck = await pool.query(`
  SELECT plu, shop_id, qty FROM stock WHERE plu = $1 AND shop_id = $2`, [orderCheck.rows[0].plu, orderCheck.rows[0].shop_id]);

  if (stockCheck.rowCount === 0) {
    return next(new ErrorBadRequest('Нет товара на полке'));
  } else {
    if (parseInt(stockCheck.rows[0].qty) < amount) {
      return next(new ErrorForbidden('Недостаточно товара на полке'));
    }
  }

  let query_order_qty = `
    UPDATE orders
    SET qty = qty + $2
    WHERE id = $1
    RETURNING *;
  `;
  const values_order_qty = [id, amount];

  let query_stock_qty = `
  UPDATE stock
  SET qty = qty - $3
  WHERE plu = $1 AND shop_id = $2
  RETURNING *;
`;
  const values_stock_qty = [orderCheck.rows[0].plu, orderCheck.rows[0].shop_id, amount];

  try {
    await client.query('BEGIN');
    const orders = await pool.query(query_order_qty, values_order_qty);

    if (orders.rowCount === 0) {
      return next(new ErrorBadRequest('Не удалось изменить количество товара в заказе'));
    } else {
      const stock = await pool.query(query_stock_qty, values_stock_qty);
      if (stock.rowCount === 0) {
        return next(new ErrorBadRequest('Не удалось изменить количество товара на полке'));
      } else {
        //отправляем лог в таблицу изменений
        const qty_old = orderCheck.rows[0].qty;
        const qty_new = orders.rows[0].qty;
        const plu = orders.rows[0].plu;
        const shop_id = orders.rows[0].shop_id;
        await sendChanges(Action.UPDATE, Table.ORDERS, [id, plu, shop_id, qty_old, qty_new], next);

        res.status(200).json(orders.rows[0]);
        await client.query('COMMIT');
      }
    }

  } catch (error) {
    await client.query('ROLLBACK');
    return next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//увеличение количества товара в заказе
export const decreaseOrders = async (req: Request, res: Response, next: NextFunction) => {

  const { id, amount } = req.body;

  // Проверка существования остатка товара в таблице orders
  const orderCheck = await pool.query(`
  SELECT id, plu, shop_id, qty FROM orders WHERE id = $1`, [id]);

  if (orderCheck.rowCount === 0) {
    return next(new ErrorBadRequest('Заказ с указанным id не найден'));
  } else {
    if (orderCheck.rows[0].qty < amount) {
      return next(new ErrorForbidden('Недостаточно товара в заказе'));
    }
  }

  // Проверяем является ли amount положительным, целочисленным числом
  if (!isPositiveInteger(amount)) {
    return next(new ErrorForbidden('Некорректное значение количества'));
  }

  let query_order_qty = `
    UPDATE orders
    SET qty = qty - $2
    WHERE id = $1
    RETURNING *;
  `;
  const values_order_qty = [id, amount];

  let query_stock_qty = `
  UPDATE stock
  SET qty = qty + $3
  WHERE plu = $1 AND shop_id = $2
  RETURNING *;
`;
  const values_stock_qty = [orderCheck.rows[0].plu, orderCheck.rows[0].shop_id, amount];

  try {
    await client.query('BEGIN');
    const orders = await pool.query(query_order_qty, values_order_qty);

    if (orders.rowCount === 0) {
      return next(new ErrorBadRequest('Не удалось изменить количество товара в заказе'));
    } else {
      const stock = await pool.query(query_stock_qty, values_stock_qty);
      if (stock.rowCount === 0) {
        return next(new ErrorBadRequest('Не удалось изменить количество товара на полке'));
      } else {
        //отправляем лог в таблицу изменений
        const qty_old = orderCheck.rows[0].qty;
        const qty_new = orders.rows[0].qty;
        const plu = orders.rows[0].plu;
        const shop_id = orders.rows[0].shop_id;
        await sendChanges(Action.UPDATE, Table.ORDERS, [id, plu, shop_id, qty_old, qty_new], next);
        
        res.status(200).json(orders.rows[0]);
        await client.query('COMMIT');
      }
    }

  } catch (error) {
    await client.query('ROLLBACK');
    return next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//получение записей заказов с фильтрами
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {

  const { shop_id, plu, prefix, from, to } = req.query;

  let query = 'SELECT * FROM orders';
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
      return next(new ErrorBadRequest('Товары не найдены для заданных условий'));
    }
  } catch (error: unknown) {
    return next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}