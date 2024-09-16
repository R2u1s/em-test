import axios from "axios";
import { urlChanges } from "../utils/connection";
import { client } from "../utils/connection";
import ErrorBadRequest from "../errors/bad-request";
import { NextFunction } from "express";
import { Action, Table } from "../types/types";

export const sendChanges = async (
  action: Action,
  table: Table,
  data: [...any],
  next: NextFunction
) => {

  let obj;

  if (action === Action.CREATE) {
    if (table === Table.PRODUCTS) {
      const [plu, name] = data;
      obj = {
        action: action,
        change: {
          table: table,
          plu: plu,
          shop_id: null,
          old: null,
          new: {
            plu: plu,
            name: name
          }
        }
      }
    }
    if (table === Table.STOCK) {
      const [plu, shop_id, qty] = data;
      obj = {
        action: action,
        change: {
          table: table,
          plu: plu,
          shop_id: shop_id,
          old: null,
          new: {
            plu: plu,
            shop_id: shop_id,
            qty: qty
          }
        }
      }
    }
    if (table === Table.ORDERS) {
      const [plu, shop_id, qty, order_id] = data;
      obj = {
        action: action,
        change: {
          table: table,
          plu: plu,
          shop_id: shop_id,
          old: null,
          new: {
            id: order_id,
            plu: plu,
            shop_id: shop_id,
            qty: qty
          }
        }
      }
    }
  }

  if (action === Action.UPDATE) {
    if (table === Table.STOCK) {
      const [plu, shop_id, qty_old, qty_new] = data;
      obj = {
        action: action,
        change: {
          table: table,
          plu: plu,
          shop_id: shop_id,
          old: {
            qty: qty_old
          },
          new: {
            qty: qty_new
          }
        }
      }
    }
    if (table === Table.ORDERS) {
      const [id, plu, shop_id, qty_old, qty_new] = data;
      obj = {
        action: action,
        change: {
          table: table,
          plu: plu,
          shop_id: shop_id,
          old: {
            id: id,
            qty: qty_old
          },
          new: {
            id: id,
            qty: qty_new
          }
        }
      }
    }
  }
  
  try {
    await axios.post(urlChanges, obj);
  } catch {
    await client.query('ROLLBACK');
    return next(new ErrorBadRequest('Ошибка логирования'));
  }
}