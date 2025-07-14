const { CohereClient } = require('cohere-ai');
require("dotenv").config();


// Initialize Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const getChatbotResponse = async (message) => {
  try {
    // Validate API key
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key is not configured');
    }

    // Create a healthcare-focused prompt
    const prompt = `You are a helpful healthcare assistant chatbot. You help users find medical facilities, provide general health information, and assist with healthcare-related questions. Please respond to the following message in a helpful and professional manner:

User: ${message}`;

    // Call Cohere API
    const response = await cohere.generate({
      model: 'command-xlarge-nightly',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    });

    // Extract the generated text
    const reply = response.generations[0].text.trim();
    
    return reply;
  } catch (error) {
    console.error('Cohere API error:', error);
    throw new Error('Failed to generate chatbot response');
  }
};

module.exports = {
  getChatbotResponse
};