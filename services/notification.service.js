const sendEmail = require("../services/email");

// Notify user about profile updates
const sendProfileUpdateNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: "Profile Updated Successfully",
      html: `
        <h2>Profile Update Notification</h2>
        <p>Your profile has been successfully updated. If you did not make this change, please contact support immediately.</p>
      `,
    });
    console.log(`Profile update notification sent to: ${email}`);
  } catch (error) {
    console.error("Error sending profile update notification:", error);
    throw error; 
  }
};

// Notify user about account deletion
const sendAccountDeletionNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: "Account Deleted Successfully",
      html: `
        <h2>Account Deletion Notification</h2>
        <p>Your account has been successfully deleted. If this was not you, please contact support immediately.</p>
      `,
    });
    console.log(`Account deletion notification sent to: ${email}`);
  } catch (error) {
    console.error("Error sending account deletion notification:", error);
    throw error;
  }
};

// Notify user about sign-up success
const sendSignUpNotification = async (email, fullName, verificationLink) => {
  try {
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Welcome ${fullName}!</h2>
        <p>Please click the link below to verify your email and complete your registration:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });
    console.log(`Sign-up notification sent to: ${email}`);
  } catch (error) {
    console.error("Error sending sign-up notification:", error);
    throw error; // Propagate the error
  }
};

module.exports = {
  sendProfileUpdateNotification,
  sendAccountDeletionNotification,
  sendSignUpNotification,
};