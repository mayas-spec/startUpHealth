const { getChatbotResponse } = require('../services/cohere');

const askChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get chatbot response
    const reply = await getChatbotResponse(message);
    
    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        botReply: reply
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get chatbot response',
      error: error.message 
    });
  }
};

module.exports = {
  askChatbot
};