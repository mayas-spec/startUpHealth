const User = require("../models/User");
const { sendProfileUpdateNotification } = require('../services/notification.service');



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

    // Destructure the allowed fields from req.body
    const { fullName, email, contact, address } = req.body;

    // Construct the updated data object
    const updatedData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(contact && { contact }),
      ...(address && { address }),
    };

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
  getUserProfile,
  updateUserProfile,
  deleteAccount,
};
