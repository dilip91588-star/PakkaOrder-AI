import { Router } from 'express';
import { duplicateCandidateController } from '../controllers/duplicateCandidateController.js';
import { authContextMiddleware } from '../middleware/authContext.js';

export const duplicateCandidateRouter = Router();

duplicateCandidateRouter.use(authContextMiddleware);

duplicateCandidateRouter.get('/', (req, res) => duplicateCandidateController.listCandidates(req, res));
duplicateCandidateRouter.get('/:id', (req, res) => duplicateCandidateController.getCandidateById(req, res));
duplicateCandidateRouter.post('/:id/resolve', (req, res) => duplicateCandidateController.resolveCandidate(req, res));
duplicateCandidateRouter.post('/:id/explain', (req, res) => duplicateCandidateController.explainCandidate(req, res));
duplicateCandidateRouter.get('/:id/explain', (req, res) => duplicateCandidateController.explainCandidate(req, res));

