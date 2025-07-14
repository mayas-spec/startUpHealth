const express = require("express");
const router = express.Router();
const chatCtrl = require("../controllers/chatbot.controller");
const { auth, authorize } = require("../middlewares/authMiddleware");

router.post("/query", auth, authorize("user"), chatCtrl.askChatbot);

module.exports = router;
