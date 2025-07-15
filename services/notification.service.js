const sendEmail = require('../services/email'); 
// Notify user about profile updates
const sendProfileUpdateNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Profile Updated Successfully',
      html: `
        <h2>Profile Update Notification</h2>
        <p>Your profile has been successfully updated. If you did not make this change, please contact support immediately.</p>
      `,
    });
    console.log(`Profile update notification sent to: ${email}`);
  } catch (error) {
    console.error('Error sending profile update notification:', error);
  }
};

// Notify user about account deletion
const sendAccountDeletionNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Account Deleted Successfully',
      html: `
        <h2>Account Deletion Notification</h2>
        <p>Your account has been successfully deleted. If this was not you, please contact support immediately.</p>
      `,
    });
    console.log(`Account deletion notification sent to: ${email}`);
  } catch (error) {
    console.error('Error sending account deletion notification:', error);
  }
};

// Notify user about sign-up success
const sendSignUpNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <h2>Welcome!</h2>
        <p>Thank you for signing up. We're excited to have you on board. If you have any questions, feel free to contact us.</p>
      `,
    });
    console.log(`Sign-up notification sent to: ${email}`);
  } catch (error) {
    console.error('Error sending sign-up notification:', error);
  }
};

module.exports = {
  sendProfileUpdateNotification,
  sendAccountDeletionNotification,
  sendSignUpNotification,
};