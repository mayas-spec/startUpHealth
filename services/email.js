const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.mailgun.net' 
});

const sendEmail = async (options) => {
  const message = {
    from: `MAFIA Platform <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, message);
    console.log('Email sent successfully to:', options.to);
    console.log('Mailgun response:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw error;
  }
};

module.exports =  sendEmail ;