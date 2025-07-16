const express = require("express");
const router = express.Router();
const { getChatbotResponse } = require("../services/cohere");

router.post('/query', async (req, res) => {
    try {
      const { message } = req.body;
      const response = await getChatbotResponse(message);
      res.json({
        success: true,
        response: response
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get chatbot response",
        error: error.message
      });
    }
  });

module.exports = router;