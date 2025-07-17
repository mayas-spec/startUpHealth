const express = require("express");
const router = express.Router();
const {handleChatbotQuery}  = require("../controllers/chatbot.controller");

router.post('/query', handleChatbotQuery);

module.exports = router;