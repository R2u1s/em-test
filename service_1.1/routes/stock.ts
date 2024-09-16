import { Router } from 'express';
import {
  createStock, increaseStock, decreaseStock, getStock
} from '../controllers/stock';

const routerStock = Router();
routerStock.post('/create', createStock);
routerStock.patch('/increase', increaseStock);
routerStock.patch('/decrease', decreaseStock);
routerStock.get('/',getStock);

export default routerStock;