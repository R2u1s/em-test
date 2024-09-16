import { Router } from 'express';
import {
  createChange, getChanges
} from '../controllers/main.mjs';

const routerMain = Router();
routerMain.get('/', getChanges);
routerMain.post('/',createChange);

export default routerMain;