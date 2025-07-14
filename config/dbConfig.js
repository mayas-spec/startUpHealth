const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    
    const options = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };
    
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Server will continue without database connection');
  }
};

module.exports = connectDB;