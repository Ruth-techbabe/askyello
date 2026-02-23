const express = require('express');
const chatbotController = require('../controllers/chatbot.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { chatbotRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/chat', optionalAuth, chatbotRateLimit, chatbotController.chatWithBot);

module.exports = router;