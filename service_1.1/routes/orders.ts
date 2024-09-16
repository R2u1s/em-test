import { Router } from 'express';
import {
  createOrder, decreaseOrders, getOrders, increaseOrders
} from '../controllers/orders';

const routerOrders = Router();
routerOrders.get('/', getOrders);
routerOrders.post('/create', createOrder);
routerOrders.patch('/increase', increaseOrders);
routerOrders.patch('/decrease', decreaseOrders);

export default routerOrders;