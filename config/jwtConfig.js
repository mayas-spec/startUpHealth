//  this sets up authentication tokens, temporary ID cards for users. when a user logs in , they get a token to prove who they are. Tokens expire for security so users need to refresh or log in  again.
const jwt = require('jsonwebtoken');
require("dotenv").config();

const generateToken = (payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    });
};
const generateResetToken = (userId) => {
    return jwt.sign(
      { 
        userId: userId.toString(),
        purpose: 'password-reset',
        timestamp: Date.now() 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } 
    );
  };

  const generateEmailVerificationToken = (userId, email) => {
    return jwt.sign(
      { 
        userId: userId.toString(),
        email: email,
        purpose: 'email-verification',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } 
    );
  };


module.exports = {
    generateToken,
    generateResetToken,
    generateEmailVerificationToken
}