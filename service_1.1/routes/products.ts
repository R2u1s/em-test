import { Router } from 'express';
import {
  getProducts, createProduct
} from '../controllers/products';

const routerProducts = Router();
routerProducts.get('/', getProducts);
routerProducts.post('/create', createProduct);

export default routerProducts;