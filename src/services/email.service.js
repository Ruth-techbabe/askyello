const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(' Email service not configured. Emails will not be sent.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send email with both link and OTP
  async sendVerificationEmailWithOTP(email, name, verificationToken, otp, businessName) {
    if (!this.transporter) {
      console.warn(` Email service not configured.`);
      console.log(` Verification token: ${verificationToken}`);
      console.log(` OTP: ${otp}`);
      console.log(`Verification URL: ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`);
      return;
    }

    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: `"Ask Yello" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Ask Yello Provider Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 20px auto; 
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #FDB819 0%, #f9a825 100%);
                padding: 30px 20px; 
                text-align: center; 
              }
              .header h1 { 
                color: #000; 
                margin: 0;
                font-size: 28px;
              }
              .content { 
                padding: 30px; 
              }
              .otp-box {
                background-color: #f8f9fa;
                border: 2px dashed #FDB819;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                text-align: center;
              }
              .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #FDB819;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
                margin: 10px 0;
              }
              .button { 
                display: inline-block; 
                padding: 14px 35px; 
                background-color: #FDB819; 
                color: #000; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                font-size: 16px;
                margin: 20px 0;
                transition: background-color 0.3s;
              }
              .button:hover {
                background-color: #f9a825;
              }
              .divider {
                text-align: center;
                margin: 30px 0;
                position: relative;
              }
              .divider::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background-color: #ddd;
              }
              .divider span {
                background-color: #fff;
                padding: 0 15px;
                position: relative;
                color: #666;
                font-size: 14px;
              }
              .info-box {
                background-color: #e3f2fd;
                border-left: 4px solid #2196F3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .steps {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .steps ol {
                margin: 10px 0;
                padding-left: 20px;
              }
              .steps li {
                margin: 8px 0;
              }
              .footer { 
                text-align: center; 
                padding: 20px; 
                background-color: #f8f9fa;
                color: #777; 
                font-size: 12px; 
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Ask Yello!</h1>
              </div>
              
              <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Thank you for registering <strong>${businessName}</strong> on Ask Yello - Africa's premier SME service marketplace!</p>
                
                <div class="info-box">
                  <strong>📋 Two-Step Verification Process:</strong>
                  <p style="margin: 10px 0 0 0;">Complete both steps below to activate your provider account.</p>
                </div>

                <!-- STEP 1: Email Verification -->
                <h3 style="color: #FDB819;">Step 1: Verify Your Email Address</h3>
                <p>Click the button below to verify your email address:</p>
                
                <center>
                  <a href="${verificationUrl}" class="button">✓ Verify Email</a>
                </center>
                
                <p style="font-size: 12px; color: #666;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationUrl}</p>

                <div class="divider"><span>AND</span></div>

                <!-- STEP 2: OTP Verification -->
                <h3 style="color: #FDB819;">Step 2: Enter Your OTP Code</h3>
                <p>After verifying your email, you'll be prompted to enter this OTP code to complete your profile verification:</p>
                
                <div class="otp-box">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code:</p>
                  <div class="otp-code">${otp}</div>
                  <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Valid for 24 hours</p>
                </div>

                <div class="warning">
                  <strong>⚠️ Keep this code secure!</strong>
                  <p style="margin: 5px 0 0 0;">Never share this OTP with anyone. Ask Yello staff will never ask for this code.</p>
                </div>

                <div class="steps">
                  <h4 style="margin-top: 0;">What happens next?</h4>
                  <ol>
                    <li>Click "Verify Email" button above</li>
                    <li>You'll be redirected to the vendor login page</li>
                    <li>Enter your <strong>Business Name</strong> and <strong>Password</strong></li>
                    <li>You'll be prompted to enter the <strong>OTP code</strong> (${otp})</li>
                    <li>Your profile will be automatically verified! ✅</li>
                    <li>Complete your profile and start receiving customers</li>
                  </ol>
                </div>

                <div class="info-box">
                  <strong>💡 Important Tips:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Your login username is: <strong>${businessName}</strong></li>
                    <li>Check your spam folder if you don't see this email</li>
                    <li>This verification link and OTP expire in 24 hours</li>
                    <li>Need help? Contact our support team</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">If you didn't create an account on Ask Yello, please ignore this email.</p>
              </div>
              
              <div class="footer">
                <p>&copy; 2026 Ask Yello. All rights reserved.</p>
                <p>Africa's #1 SME Service Marketplace</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email with OTP sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error.message);
      throw error;
    }
  }

  // Keep the old method for backward compatibility
  async sendVerificationEmail(email, name, verificationToken) {
    return this.sendVerificationEmailWithOTP(email, name, verificationToken, null, 'your business');
  }
}

module.exports = new EmailService();