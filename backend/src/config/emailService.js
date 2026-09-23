const nodemailer = require("nodemailer");

// Create transporter — uses .env credentials if set, otherwise Ethereal test account
const createTransporter = async () => {
  // If real SMTP credentials are provided in .env, use them
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Otherwise use Ethereal — auto-generated test account (no real emails sent)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporter;
};

/**
 * Send email notification when a request is approved
 */
exports.sendApprovalEmail = async ({ shelterEmail, shelterName, foodName, quantity, donorName }) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"SharePlate" <${process.env.EMAIL_USER || "shareplate@example.com"}>`,
      to: shelterEmail,
      subject: "Your Food Request Has Been Approved!",
      html: `
        <h2>Good News, ${shelterName}!</h2>
        <p>Your request for <strong>${quantity} units of ${foodName}</strong> has been <strong style="color:green;">approved</strong> by <strong>${donorName}</strong>.</p>
        <p>Please check your SharePlate dashboard for pickup scheduling details.</p>
        <br/>
        <p>Thank you for using SharePlate.</p>
      `,
    });

    // Log preview URL for Ethereal test emails
    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Email preview (Ethereal):", nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    // Email errors should not block the API response
    console.error("Email send failed:", err.message);
  }
};

/**
 * Send email notification when a request is rejected
 */
exports.sendRejectionEmail = async ({ shelterEmail, shelterName, foodName }) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"SharePlate" <${process.env.EMAIL_USER || "shareplate@example.com"}>`,
      to: shelterEmail,
      subject: "Update on Your Food Request",
      html: `
        <h2>Hello, ${shelterName}</h2>
        <p>Unfortunately, your request for <strong>${foodName}</strong> has been <strong style="color:red;">rejected</strong> by the donor.</p>
        <p>Please browse other available donations on SharePlate and submit a new request.</p>
        <br/>
        <p>Thank you for using SharePlate.</p>
      `,
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Email preview (Ethereal):", nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};
