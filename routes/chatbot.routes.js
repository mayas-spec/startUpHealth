const express = require("express");
const router = express.Router();
const { handleChatbotQuery } = require("../controllers/chatbot.controller");
const { auth } = require("../middlewares/authMiddleware");

router.post('/query', auth, handleChatbotQuery);

module.exports = router;