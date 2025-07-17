const getChatbotResponse = require("../services/cohere");

const handleChatbotQuery = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate the input
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Use the authenticated user from req.user (set by the auth middleware)
    const user = req.user;

    // Get the chatbot response from the service
    const response = await getChatbotResponse(message, user);

    // Send the response back to the client
    res.status(200).json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("Error in chatbot controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chatbot response",
      error: error.message,
    });
  }
};

module.exports = { handleChatbotQuery };