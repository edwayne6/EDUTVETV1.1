const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'edutvet1@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password-here'
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

// Verify connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Email service connection failed:', error.message);
    return false;
  }
};

// Send email function
const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: `"Edu-TVET" <${emailConfig.auth.user}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Predefined email templates
const emailTemplates = {
  // Document uploaded notification
  documentUploaded: (data) => ({
    subject: `New Document Uploaded: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Document Uploaded</h2>
        <p>A new document has been uploaded to Edu-TVET and requires review:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.title}</h3>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${data.department}</p>
          <p style="margin: 5px 0;"><strong>Level:</strong> ${data.level}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${data.docType}</p>
          <p style="margin: 5px 0;"><strong>Uploaded by:</strong> ${data.submittedBy}</p>
          <p style="margin: 5px 0;"><strong>Upload Date:</strong> ${data.date}</p>
        </div>
        <p>Please review this document in the <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin.html'}" style="color: #2563eb;">admin dashboard</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Edu-TVET Document Management System.</p>
      </div>
    `
  }),

  // Document approved notification
  documentApproved: (data) => ({
    subject: `Document Approved: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Document Approved</h2>
        <p>Great news! Your document has been approved and is now available for download:</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.title}</h3>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${data.department}</p>
          <p style="margin: 5px 0;"><strong>Level:</strong> ${data.level}</p>
          <p style="margin: 5px 0;"><strong>Document Code:</strong> ${data.documentCode}</p>
        </div>
        <p>You can now share this document code with students and colleagues.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents.html" style="background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse Documents</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Edu-TVET Document Management System.</p>
      </div>
    `
  }),

  // Document rejected notification
  documentRejected: (data) => ({
    subject: `Document Requires Revision: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Document Requires Revision</h2>
        <p>Your document has been reviewed and requires some changes before approval:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.title}</h3>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${data.department}</p>
          <p style="margin: 5px 0;"><strong>Feedback:</strong> ${data.feedback || 'Please review and resubmit with the requested changes.'}</p>
        </div>
        <p>Please make the necessary revisions and upload the updated document.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/upload.html" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Upload Revised Document</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Edu-TVET Document Management System.</p>
      </div>
    `
  }),

  // Welcome email for new users
  welcomeUser: (data) => ({
    subject: `Welcome to Edu-TVET, ${data.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Edu-TVET!</h2>
        <p>Thank you for joining our educational community. Your account has been created successfully.</p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Account Details</h3>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${data.username}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
        </div>
        <p>You can now upload documents, access educational materials, and contribute to our growing library of TVET resources.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated message from Edu-TVET Document Management System.</p>
      </div>
    `
  }),

  // System alert for admins
  systemAlert: (data) => ({
    subject: `Edu-TVET System Alert: ${data.type}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">System Alert</h2>
        <p>A system alert has been triggered:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.type}</h3>
          <p style="margin: 5px 0;"><strong>Message:</strong> ${data.message}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${data.details ? `<p style="margin: 5px 0;"><strong>Details:</strong> ${data.details}</p>` : ''}
        </div>
        <p>Please check the admin dashboard for more information.</p>
        <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin.html'}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Dashboard</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated system alert from Edu-TVET.</p>
      </div>
    `
  })
};

// High-level functions for common notifications
const notifyDocumentUploaded = async (documentData) => {
  const template = emailTemplates.documentUploaded(documentData);
  // Send to all admins - in a real system, you'd query for admin emails
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['edutvet1@gmail.com'];

  for (const email of adminEmails) {
    await sendEmail(email, template.subject, template.html);
  }
};

const notifyDocumentApproved = async (documentData, userEmail) => {
  const template = emailTemplates.documentApproved(documentData);
  await sendEmail(userEmail, template.subject, template.html);
};

const notifyDocumentRejected = async (documentData, userEmail, feedback) => {
  const template = emailTemplates.documentRejected({ ...documentData, feedback });
  await sendEmail(userEmail, template.subject, template.html);
};

const notifyWelcomeUser = async (userData) => {
  const template = emailTemplates.welcomeUser(userData);
  await sendEmail(userData.email, template.subject, template.html);
};

const notifySystemAlert = async (alertData) => {
  const template = emailTemplates.systemAlert(alertData);
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['edutvet1@gmail.com'];

  for (const email of adminEmails) {
    await sendEmail(email, template.subject, template.html);
  }
};

module.exports = {
  verifyConnection,
  sendEmail,
  notifyDocumentUploaded,
  notifyDocumentApproved,
  notifyDocumentRejected,
  notifyWelcomeUser,
  notifySystemAlert,
  emailTemplates
};