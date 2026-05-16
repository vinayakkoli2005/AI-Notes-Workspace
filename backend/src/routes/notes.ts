import { Router } from 'express';
import { getNotes, getNote, createNote, updateNote, deleteNote, shareNote, unshareNote, getSharedNote } from '../controllers/notes';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public route for shared notes
router.get('/shared/:shareId', getSharedNote);

// Protected routes
router.use(requireAuth);
router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNote);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/share', shareNote);
router.delete('/:id/share', unshareNote);

export default router;
