const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER || 'adaccc001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_PASS || 'bskpSo8BDMcbC44'
  }
});

/**
 * Sends a welcome email to a newly signed up user.
 * @param {string} toEmail Recipient's email address
 * @param {string} toName Recipient's name
 */
async function sendWelcomeEmail(toEmail, toName) {
  const brandUrl = process.env.FRONTEND_URL || 'https://TarunSajikumar.github.io/FD/frontend';
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Food Point</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f6f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f6f9fc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #FF6B2B 0%, #FF9A5C 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      margin: 10px 0 0 0;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
      color: #32325d;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 20px;
      font-weight: 600;
      margin-top: 0;
      color: #1e1e2f;
    }
    .content p {
      font-size: 16px;
      margin: 0 0 20px 0;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #FF6B2B;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(255, 107, 43, 0.25);
    }
    .features {
      border-top: 1px solid #e6ebf1;
      padding-top: 30px;
      margin-top: 30px;
    }
    .feature-item {
      margin-bottom: 20px;
    }
    .feature-icon {
      font-size: 20px;
      margin-right: 10px;
      vertical-align: middle;
    }
    .feature-text {
      font-size: 15px;
      color: #525f7f;
    }
    .footer {
      background-color: #f6f9fc;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #8898aa;
      border-top: 1px solid #e6ebf1;
    }
    .footer p {
      margin: 0 0 10px 0;
    }
    .footer a {
      color: #FF6B2B;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>FOOD POINT</h1>
        <p>Your Favorite Meals, Ordered Instantly 🍔</p>
      </div>
      <div class="content">
        <h2>Hey ${toName},</h2>
        <p>Welcome to Food Point! We are absolutely thrilled to have you join our community. Your account has been successfully created and you're now ready to explore our menu and order fresh, flavorful meals.</p>
        
        <div class="cta-container">
          <a href="${brandUrl}" class="cta-button" target="_blank">Order Delicious Food Now</a>
        </div>

        <div class="features">
          <p><strong>With your Food Point account, you can:</strong></p>
          <div class="feature-item">
            <span class="feature-icon">🍛</span>
            <span class="feature-text">Browse a wide variety of biryanis, momos, curries, and more.</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <span class="feature-text">Enjoy ultra-fast order tracking and real-time updates.</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📦</span>
            <span class="feature-text">Track your complete order history and save your favorites.</span>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated welcoming email from Food Point.</p>
        <p>&copy; 2026 Food Point. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: '"Food Point" <adaccc001@smtp-brevo.com>',
    to: toEmail,
    subject: 'Welcome to Food Point! 🍔',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✉️ Welcome email sent successfully to:', toEmail, 'Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send welcome email to:', toEmail, 'Error:', error.message);
    throw error;
  }
}

module.exports = {
  sendWelcomeEmail
};
