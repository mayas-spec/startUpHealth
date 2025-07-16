const { CohereClient } = require('cohere-ai');
require("dotenv").config();

// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        const delayMs = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit, retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }
      throw error;
    }
  }
};

const getChatbotResponse = async (message) => {
  try {
    console.log("Message received:", message);
    console.log("Cohere API Key exists:", !!process.env.COHERE_API_KEY);
    
    if (!process.env.COHERE_API_KEY) {
      throw new Error("Cohere API key is not configured");
    }

    if (!message || message.trim() === "") {
      throw new Error("Message cannot be empty");
    }

    console.log("Making Cohere API call...");
    
    const makeAPICall = async () => {
      return await cohere.chat({
        model: "command-light", // Fast and efficient model
        message: message,
        max_tokens: 300,
        temperature: 0.7,
        chat_history: [], // Add conversation history if needed
        prompt_truncation: "AUTO"
      });
    };

    // Use retry logic for rate limiting
    const response = await retryWithBackoff(makeAPICall, 3);

    console.log("Cohere API Response received");
    
    if (!response.text) {
      throw new Error("No response text received from Cohere");
    }

    const reply = response.text.trim();
    console.log("Generated reply:", reply);
    return reply;
  } catch (error) {
    console.error("Detailed Cohere API error:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Error body:", error.body);
    
    // Handle different error types
    if (error.status === 401) {
      throw new Error("Invalid Cohere API key");
    } else if (error.status === 429) {
      throw new Error("Cohere API rate limit exceeded. Please wait and try again later.");
    } else if (error.status === 500) {
      throw new Error("Cohere API server error");
    } else if (error.status === 503) {
      throw new Error("Cohere API temporarily unavailable");
    } else {
      throw new Error(`Cohere API error: ${error.message}`);
    }
  }
};

// Alternative method using Cohere's generate endpoint (for more control)
const getChatbotResponseGenerate = async (message) => {
  try {
    console.log("Using Cohere Generate API...");
    
    const makeAPICall = async () => {
      return await cohere.generate({
        model: "command-light",
        prompt: `Human: ${message}\nAI:`,
        max_tokens: 300,
        temperature: 0.7,
        k: 0,
        p: 0.75,
        stop_sequences: ["Human:", "AI:"],
        return_likelihoods: "NONE"
      });
    };

    const response = await retryWithBackoff(makeAPICall, 3);
    
    if (!response.generations || response.generations.length === 0) {
      throw new Error("No generations received from Cohere");
    }

    const reply = response.generations[0].text.trim();
    console.log("Generated reply:", reply);
    return reply;
  } catch (error) {
    console.error("Cohere Generate API error:", error);
    throw new Error(`Cohere Generate API error: ${error.message}`);
  }
};

module.exports = {
  getChatbotResponse,
  getChatbotResponseGenerate, 
};