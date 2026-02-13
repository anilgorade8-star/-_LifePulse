const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');

/**
 * POST /api/chat
 * Send a message to the AI assistant and receive a response
 * 
 * Request body:
 * {
 *   "message": "User's health query or symptom description"
 * }
 * 
 * Response:
 * {
 *   "reply": "AI assistant's response",
 *   "timestamp": "ISO timestamp"
 * }
 */
router.post('/chat', handleChat);

module.exports = router;
