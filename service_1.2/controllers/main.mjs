import { pool } from '../utils/connection.mjs';
import ErrorBadRequest from '../errors/bad-request.mjs';

export const createChange = async (req, res, next) => {

  const { action, change } = req.body;

  let query = `
    INSERT INTO changes (action,change)
    VALUES ($1,$2)
    RETURNING *;
    `;
  try {
    const changes = await pool.query(query, [action, change]);
    res.status(201).json(changes.rows);
  } catch (error) {
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}

export const getChanges = async (req, res, next) => {

  const { shop_id, plu, prefix, action, from, to, pagination, page } = req.query;

  let query = 'SELECT * FROM changes ';
  let values = [];
  let index = 1;

  //проверяем, если shop_id адекватно задан, то добавляем его в параметры запроса
  if (shop_id && typeof shop_id === 'string') {
    query += `WHERE change->>'shop_id' ILIKE $1`;
    values.push(`%${shop_id}%`);
    index++;
  }

  //проверяем, если plu адекватно задан, то добавляем его в параметры запроса
  //можно сделать фильтр по префиксу артикула plu, который обозначает
  //какие-либо параметры товара (к примеру органическое выращивание или ГМО)
  //для фильтра по префиксу проверяем является ли plu 5-ти значным
  if (prefix && typeof prefix === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}change->>'plu' ~ '^[0-9]{5}$' AND LEFT(change->>'plu, 1) = $${index}::text`;
    values.push(prefix);
    index++;
  } else if (plu && typeof plu === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}change->>'plu' = $${index}::text`;
    values.push(plu);
    index++;
  }

  //добавляем к запросу фильтр по action
  if (action && typeof action === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}action = $${index}`;
    values.push(action);
    index++;
  }

  //добавляем к запросу фильтры по количеству
  if (from && typeof from === 'string' && to && typeof to === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}date >= $${index} AND date <= $${index + 1}`;
    values.push(from, to);
    index+=2;
  } else if (from && typeof from === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}date >= $${index}`;
    values.push(from);
    index++;
  } else if (to && typeof to === 'string') {
    query += `${index > 1 ? ' AND ' : ' WHERE '}date <= $${index}`;
    values.push(to);
    index++;
  }

  //добавляем к запросу параметры пагинации
  if (pagination && typeof pagination === 'string' && page && typeof page === 'string') {
    const offset = (parseInt(page,10) - 1) * parseInt(pagination,10);
    
    query += ` ORDER BY date LIMIT $${index} OFFSET $${index+1}`;
    values.push(pagination,offset);
  }

  try {
    const changes = await pool.query(query, values);
    if (changes.rowCount !== 0) {
      res.status(200).json(changes.rows);
    } else {
      next(new ErrorBadRequest('Записи не найдены для заданных условий'));
    }
  } catch (error) {
    next(new ErrorBadRequest(`Ошибка БД: ${error}`));
  }
}
