import { NextFunction, Request, Response } from 'express';
import { pool, urlChanges } from '../utils/connection';
import ErrorBadRequest from '../errors/bad-request';
import ErrorForbidden from '../errors/forbidden';
import ErrorNotFound from '../errors/not-found';
import { client } from '../utils/connection';
import { sendChanges } from '../helpers/helpers';
import { Action, Table } from '../types/types';

//создание записи продукта в таблице products
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {

  const { plu, name } = req.body;

  let query = `
    INSERT INTO products (plu,name)
    VALUES ($1,$2)
    RETURNING *;
  `;

  try {
    //транзакция нужна поскольку помимо создания продукта делается запрос логирования
    await client.query('BEGIN');
    const products = await pool.query(query, [plu, name]);
 
    //отправляем лог в таблицу изменений
    await sendChanges(Action.CREATE,Table.PRODUCTS,[plu,name],next);
    
    res.status(201).json(products.rows[0]);
    await client.query('COMMIT');
  } catch (error: unknown) {
    if (error instanceof Error && (error as any).code === '23505') {
      await client.query('ROLLBACK');
      return next(new ErrorForbidden('Товар с таким артикулом уже существует'));
    }
    await client.query('ROLLBACK');
    return next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

//получение товаров с фильтром по имени
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {

  const { name, plu, prefix } = req.query;

  let query = 'SELECT * FROM products';
  let values: string[] = [];
  let index = 1;

  //проверяем, если name адекватно задан, то добавляем его в параметры запроса
  if (name && typeof name === 'string') {
    query += ' WHERE name ILIKE $1';
    values.push(`%${name}%`);
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

