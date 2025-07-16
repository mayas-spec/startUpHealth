const express = require("express");
const router = express.Router();
const { handleChatbotQuery } = require("../controllers/chatbot.controller");
const { auth,authorize } = require("../middlewares/authMiddleware");

router.post('/query', auth,authorize("user"), handleChatbotQuery);

module.exports = router;