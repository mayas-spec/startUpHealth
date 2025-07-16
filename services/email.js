const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
  
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validateEmail(to)) {
      throw new Error("Invalid recipient email address");
    }

  
    if (!text && !html) {
      throw new Error("Email content (text or html) is required");
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email failed to send:", error);
    throw error; 
  }
};

module.exports = sendEmail;