// server/routes/messages.js

import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/:userId/:chatPartnerId', getMessages);

export default router;
