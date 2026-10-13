import { Router } from 'express';
import { sourceOrderController } from '../controllers/sourceOrderController.js';
import { authContextMiddleware } from '../middleware/authContext.js';

export const sourceOrderRouter = Router();

// Enforce trusted tenant boundary on all source-order operations
sourceOrderRouter.use(authContextMiddleware);

// Core Ingestion Routes
sourceOrderRouter.post('/', (req, res, next) => sourceOrderController.create(req, res, next));
sourceOrderRouter.get('/', (req, res, next) => sourceOrderController.list(req, res, next));
sourceOrderRouter.post('/extract', (req, res, next) => sourceOrderController.extract(req, res, next));
sourceOrderRouter.post('/import-csv', (req, res, next) => sourceOrderController.importCsv(req, res, next));
sourceOrderRouter.get('/:id', (req, res, next) => sourceOrderController.getById(req, res, next));
sourceOrderRouter.post('/:id/match', (req, res) => {
  import('../controllers/duplicateCandidateController.js').then(({ duplicateCandidateController }) => {
    duplicateCandidateController.matchSourceOrder(req, res);
  });
});

