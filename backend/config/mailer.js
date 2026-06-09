const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@campusevents.com';

  const relayUrl = process.env.GMAIL_RELAY_URL;
  if (relayUrl) {
    try {
      const res = await fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: options.email,
          subject: options.subject,
          body: options.message,
          html: options.html
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          console.log(`Email sent successfully via Gmail HTTP Relay: ${options.email}`);
          return { success: true, viaRelay: true };
        }
      }
      console.warn('Gmail HTTP Relay returned non-success response, trying SMTP...');
    } catch (err) {
      console.warn('Gmail HTTP Relay failed, trying SMTP...', err.message);
    }
  }

  // If no SMTP host is configured, mock email delivery and log it
  if (!host || !user || !pass) {
    console.log('\n==================================================');
    console.log(`[DEV EMAIL SIMULATION] Sending Email To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--------------------------------------------------');
    console.log(options.message);
    console.log('==================================================\n');
    return { success: true, mocked: true };
  }

  const transporterConfig = host === 'smtp.gmail.com' ? {
    service: 'gmail',
    auth: {
      user,
      pass
    },
    connectionTimeout: 8000, // 8 seconds timeout
    greetingTimeout: 8000,
    socketTimeout: 10000
  } : {
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // secure is true only for port 465 (SSL)
    auth: {
      user,
      pass
    },
    connectionTimeout: 8000, // 8 seconds timeout
    greetingTimeout: 8000,
    socketTimeout: 10000
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${options.message}</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
