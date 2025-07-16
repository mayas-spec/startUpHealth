const User = require("../models/User");
const Facility = require("../models/facility");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendSignUpNotification } = require("../services/notification.service");
const { generateResetToken, generateToken, generateEmailVerificationToken } = require("../config/jwtConfig");

const SignUp = async (req, res) => {
  console.log("Signup route hit:", req.body);
  const { fullName, email, contact, password, confirmPassword } = req.body;

  try {
    
    if (!email || !password || !confirmPassword || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = email.toLowerCase();


    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the user
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      contact,
      password,
      confirmPassword,
      isEmailVerified: false,
    });

    console.log("User created:", user.email);

    // Generate verification token
    const verificationPayload = {
      email: normalizedEmail,
      type: "email_verification",
      timestamp: Date.now(),
    };
    const verificationToken = generateToken(verificationPayload);

    // Validate CLIENT_URL
    if (!process.env.CLIENT_URL) {
      throw new Error("CLIENT_URL is not defined in environment variables");
    }

    // Create verification link
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send verification email using notification service
    await sendSignUpNotification(normalizedEmail, fullName, verificationLink);

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



const Login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt:", email);
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("User not found");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        message: "Please verify your email before logging in",
      });
    }

    console.log("Found user:", user.email);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Password comparison failed");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};


const sendResetLink = async (req, res) => {
  const { email } = req.body;
  
  try {
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    
    const resetToken = generateResetToken(user._id);

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 15 minutes for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`Password reset link sent to: ${user.email}`);
    
    res.status(200).json({ 
      message: "If the email exists, a reset link has been sent" 
    });
    
  } catch (error) {
    console.error("Reset link error:", error);
    res.status(500).json({ 
      message: "An error occurred while processing your request" 
    });
  }
};


const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  
  try {
   
    if (!token || !token.trim()) {
      return res.status(400).json({ 
        message: "Reset token is required" 
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Validate token format
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return res.status(400).json({ 
        message: "Invalid token format" 
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for password reset
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ 
        message: "Invalid token type" 
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid token - user not found" 
      });
    };

    // Check if token has expired 
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ 
        message: "Reset token has expired" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update user password and clear reset token
    await User.findByIdAndUpdate(decoded.userId, { 
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined
    });

    console.log(`Password reset successful for user: ${user.email}`);
    
    res.status(200).json({ 
      message: "Password reset successful. You can now log in with your new password." 
    });
    
  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        message: "Reset token has expired. Please request a new password reset." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        message: "Invalid reset token" 
      });
    }
    
    res.status(500).json({ 
      message: "An error occurred while resetting your password" 
    });
  }
};

const VerifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If the token is invalid or expired, generate a new verification token
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        const { email } = jwt.decode(token);
        if (!email) {
          return res.status(400).json({
            message: "Invalid or expired verification token, and email could not be retrieved.",
          });
        }

        // Generate a new verification token
        const newToken = generateEmailVerificationToken(decodedToken.userId, email);

        // Send the new verification email
        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${newToken}`;
        await sendEmail({
          to: email,
          subject: "New Email Verification Link",
          html: `
            <h2>Email Verification</h2>
            <p>Your previous verification link expired. Please use the new link below to verify your email:</p>
            <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
          `,
        });

        return res.status(400).json({
          message: "Verification token expired. A new verification email has been sent.",
        });
      }

      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    // Check if it's a verification token
    if (decodedToken.purpose !== "email-verification") {
      return res.status(400).json({
        message: "Invalid token type",
      });
    }

    // Find the user with this email
    const user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email is already verified. You can log in.",
      });
    }

    // Mark the user as verified
    user.isEmailVerified = true;
    await user.save();

    console.log("User verified:", user.email);

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createFacilityAdmin = async (req, res) => {
  try {
    const { fullName, email, password, contact, facility } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Check if the facility exists
    const existingFacility = await Facility.findById(facility);
    if (!existingFacility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the facility admin
    const facilityAdmin = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      contact,
      role: "facility_admin",
      isEmailVerified: true,
      facility, 
    });

    res.status(201).json({
      success: true,
      message: "Facility admin created successfully",
      data: {
        id: facilityAdmin._id,
        fullName: facilityAdmin.fullName,
        email: facilityAdmin.email,
        role: facilityAdmin.role,
        facility: facilityAdmin.facility,
      },
    });
  } catch (error) {
    console.error("Error creating facility admin:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "User with this email does not exist",
      });
    }

    // Check if the email is already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        message: "Email is already verified. You can log in.",
      });
    }

    // Generate a new verification token
    const verificationPayload = {
      email: normalizedEmail,
      type: "email_verification",
      timestamp: Date.now(),
    };
    const verificationToken = generateToken(verificationPayload);

    // Create a new verification link
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send the verification email
    await sendEmail({
      to: normalizedEmail,
      subject: "Resend Email Verification Link",
      html: `
        <h2>Email Verification</h2>
        <p>Please click the link below to verify your email:</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    console.log(`Verification email resent to: ${user.email}`);

    res.status(200).json({
      message: "A new verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      message: "An error occurred while resending the verification email",
      error: error.message,
    });
  }
};


module.exports = {
  SignUp,
  Login,
  sendResetLink,
  resetPassword,
  VerifyEmail,
  createFacilityAdmin,
  resendVerificationEmail
};
