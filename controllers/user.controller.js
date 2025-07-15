const User = require("../models/User");
const generateToken = require('../config/jwtConfig')
const { sendProfileUpdateNotification } = require('../services/notification.service');


// Sign up
const signUp = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      contact: req.body.contact,
      password: req.body.password,
    });

    await user.save();

    // Send a sign-up notification email
    await sendSignUpNotification(user.email);

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      token: token,
    });
  } catch (error) {
    console.error('Error during sign-up:', error);
    res.status(400).json({ error: error.message });
  }
};



  const logIn = async (req, res) => {
    try {
      // Find user by email
      const user = await User.findOne({
        email: req.body.email,
        isActive: true
      });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' }); 
      }
      
      // Check password
      const isMatch = await user.comparePassword(req.body.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = generateToken(user._id);
      
      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token: token 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedData = req.body;

    // Update the user's profile in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send a notification email
    await sendProfileUpdateNotification(updatedUser.email);

    res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user's account
    await User.findByIdAndDelete(req.user.id);

    // Send a notification email
    await sendAccountDeletionNotification(user.email);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
    signUp,
    logIn,
  getUserProfile,
  updateUserProfile,
  deleteAccount,
};
