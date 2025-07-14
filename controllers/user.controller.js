const User = require("../models/User");
const generateToken = require('../config/jwtConfig')


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
        password: req.body.password
      });
  
      await user.save();
      res.status(201).json({ 
        message: 'User created successfully',
        user: user.toJSON() 
      });
      const token = generateToken(user._id);
    
      res.status(201).json({
        message: 'User created successfully',
        user: user.toJSON(),
        token: token 
      });
    } catch (error) {
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
    const { fullName, email, contact } = req.body;

    // Check if email is being updated and if it already exists
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // only include fields that are provided
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (contact) updateData.contact = contact;

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -emailVerificationToken -passwordResetToken");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user.id);
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
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
