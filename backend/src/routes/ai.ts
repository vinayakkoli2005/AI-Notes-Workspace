import { Router } from 'express';
import { generateSummary, generateActionItems, generateTitle } from '../controllers/ai';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.post('/notes/:id/summary', generateSummary);
router.post('/notes/:id/action-items', generateActionItems);
router.post('/notes/:id/title', generateTitle);

export default router;
