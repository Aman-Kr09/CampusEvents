const { enqueueEmail } = require('../queues/emailQueue');

// @desc    Submit contact / support inquiry email
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, email, and message.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.'
      });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || 'u5813051@gmail.com';
    const emailSubject = `[CampusEvents Contact] ${subject || 'New Inquiry'} from ${name}`;

    // 1. Send notification to Support Desk
    const adminMessage = `New contact form submission from CampusEvents:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\n\nMessage:\n${message}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0e12; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #818cf8;">📩 New Support Inquiry</h2>
        <p><strong>From:</strong> ${name} (&lt;<a href="mailto:${email}" style="color: #a5b4fc;">${email}</a>&gt;)</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <div style="background-color: #1a1c24; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1; margin: 15px 0;">
          <p style="white-space: pre-wrap; margin: 0; color: #e2e8f0;">${message}</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">CampusEvents Automated Contact System</p>
      </div>
    `;

    await enqueueEmail({
      email: supportEmail,
      subject: emailSubject,
      message: adminMessage,
      html: adminHtml
    });

    // 2. Send automated acknowledgment email to User
    const userSubject = 'CampusEvents - We received your message!';
    const userMessage = `Hi ${name},\n\nThank you for reaching out to CampusEvents. We have received your message regarding "${subject || 'General Inquiry'}". Our support team will review your inquiry and get back to you within 24 hours.\n\nBest regards,\nCampusEvents Support Team`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0e12; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #6366f1;">CampusEvents Support</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for reaching out! We have received your inquiry regarding <strong>"${subject || 'General Inquiry'}"</strong>.</p>
        <p>Our team is reviewing your message and will get back to you within 24 hours.</p>
        <div style="background-color: #1a1c24; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Your submitted message:</p>
          <p style="white-space: pre-wrap; margin: 0; color: #cbd5e1; font-style: italic;">"${message}"</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">If you have any urgent updates, reply directly to this email or reach us on WhatsApp at +91 7042017583.</p>
      </div>
    `;

    await enqueueEmail({
      email: email,
      subject: userSubject,
      message: userMessage,
      html: userHtml
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! Our support team will get back to you within 24 hours.'
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process contact inquiry.'
    });
  }
};
