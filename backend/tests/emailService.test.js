// ── Mock external dependencies BEFORE any require ─────────────────────────
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn()
}));

// Nodemailer sendMail mock (stable reference used throughout all tests)
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));

// ── Mutable config object – mutate properties in tests that need edge cases ─
jest.mock('../src/config/config', () => ({
  sendgridApiKey: 'SG.test-api-key',
  fromEmail: 'noreply@shareplate.com',
  fromName: 'SharePlate',
  emailUser: 'test@gmail.com',
  emailPassword: 'test-password',
  frontendUrl: 'http://localhost:3001'
}));

// Require AFTER mocks are registered so modules pick up the mocks
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const config = require('../src/config/config');
const emailService = require('../src/services/emailService');

beforeEach(() => {
  jest.clearAllMocks();
  // Wire nodemailer to return our stable sendMail mock
  nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
  // Restore config to full "both providers configured" state
  config.sendgridApiKey = 'SG.test-api-key';
  config.emailUser = 'test@gmail.com';
  config.emailPassword = 'test-password';
});

// ─── Helper fixtures ──────────────────────────────────────────────────────────
const restaurantUser = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'restaurant',
  organizationName: 'The Food Place'
};

const shelterUser = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'shelter',
  organizationName: 'City Shelter'
};

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

// ═════════════════════════════════════════════════════════════════════════════
// sendEmail – core dispatcher
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendEmail()', () => {
  it('should send via SendGrid when API key is configured', async () => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValueOnce([{ statusCode: 202 }]);

    const result = await emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      text: 'Hello'
    });

    expect(sg.send).toHaveBeenCalledTimes(1);
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test Subject'
      })
    );
    expect(result.success).toBe(true);
    expect(result.provider).toBe('SendGrid');
  });

  it('should fall back to Nodemailer when SendGrid throws', async () => {
    const sg = require('@sendgrid/mail');
    sg.send.mockRejectedValueOnce(new Error('SendGrid network error'));
    mockSendMail.mockResolvedValueOnce({ messageId: 'abc123' });

    const result = await emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Fallback Test',
      text: 'Fallback text'
    });

    expect(sg.send).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('Nodemailer');
  });

  it('should return failure when both providers fail', async () => {
    const sg = require('@sendgrid/mail');
    sg.send.mockRejectedValueOnce(new Error('SendGrid error'));
    mockSendMail.mockRejectedValueOnce(new Error('Nodemailer error'));

    const result = await emailService.sendEmail({
      to: 'user@example.com',
      subject: 'Both fail',
      text: 'text'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Nodemailer error');
  });

  it('should return failure with message when no provider is configured', async () => {
    // Temporarily remove all provider credentials
    config.sendgridApiKey = null;
    config.emailUser = null;
    config.emailPassword = null;

    const result = await emailService.sendEmail({
      to: 'user@example.com',
      subject: 'No provider',
      text: 'text'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No email service configured');
  });

  it('should include correct from name and email in SendGrid message', async () => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValueOnce([{ statusCode: 202 }]);

    await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: 'From test',
      html: '<p>Hi</p>'
    });

    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { email: 'noreply@shareplate.com', name: 'SharePlate' }
      })
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// sendWelcomeEmail
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendWelcomeEmail()', () => {
  beforeEach(() => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('should send welcome email to restaurant user', async () => {
    const result = await emailService.sendWelcomeEmail(restaurantUser);

    const sg = require('@sendgrid/mail');
    expect(sg.send).toHaveBeenCalledTimes(1);
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: restaurantUser.email,
        subject: 'Welcome to SharePlate! 🍽️'
      })
    );
    expect(result.success).toBe(true);
  });

  it('should send welcome email to shelter user', async () => {
    const result = await emailService.sendWelcomeEmail(shelterUser);

    expect(result.success).toBe(true);
    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.to).toBe(shelterUser.email);
  });

  it('should send welcome email to admin user (no organizationName)', async () => {
    const result = await emailService.sendWelcomeEmail(adminUser);
    expect(result.success).toBe(true);
  });

  it('should include organization name in email body when present', async () => {
    await emailService.sendWelcomeEmail(restaurantUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(restaurantUser.organizationName);
  });

  it('should include user name in email body', async () => {
    await emailService.sendWelcomeEmail(restaurantUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(restaurantUser.name);
  });

  it('should include role-specific content for restaurant in email body', async () => {
    await emailService.sendWelcomeEmail(restaurantUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain('food donation listings');
  });

  it('should include role-specific content for shelter in email body', async () => {
    await emailService.sendWelcomeEmail(shelterUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain('Browse available food donations');
  });

  it('should include role-specific content for admin in email body', async () => {
    await emailService.sendWelcomeEmail(adminUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain('Manage all users');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// sendVerificationEmail
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendVerificationEmail()', () => {
  const token = 'abc123verificationtoken';

  beforeEach(() => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('should send verification email with correct subject', async () => {
    const result = await emailService.sendVerificationEmail(restaurantUser, token);

    const sg = require('@sendgrid/mail');
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: restaurantUser.email,
        subject: 'Verify Your Email - SharePlate'
      })
    );
    expect(result.success).toBe(true);
  });

  it('should embed the verification URL in the email body', async () => {
    await emailService.sendVerificationEmail(restaurantUser, token);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    const expectedUrl = `http://localhost:3001/verify-email/${token}`;
    expect(sentMsg.html).toContain(expectedUrl);
    expect(sentMsg.text).toContain(expectedUrl);
  });

  it('should include username in verification email', async () => {
    await emailService.sendVerificationEmail(restaurantUser, token);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(restaurantUser.name);
  });

  it('should mention 24-hour expiry in the email', async () => {
    await emailService.sendVerificationEmail(restaurantUser, token);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain('24 hours');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// sendPasswordResetEmail
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendPasswordResetEmail()', () => {
  const resetToken = 'xyz789resettoken';

  beforeEach(() => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('should send password reset email with correct subject', async () => {
    const result = await emailService.sendPasswordResetEmail(restaurantUser, resetToken);

    const sg = require('@sendgrid/mail');
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: restaurantUser.email,
        subject: 'Password Reset Request - SharePlate'
      })
    );
    expect(result.success).toBe(true);
  });

  it('should embed the reset URL in the email body', async () => {
    await emailService.sendPasswordResetEmail(restaurantUser, resetToken);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    const expectedUrl = `http://localhost:3001/reset-password/${resetToken}`;
    expect(sentMsg.html).toContain(expectedUrl);
    expect(sentMsg.text).toContain(expectedUrl);
  });

  it('should include username in password reset email', async () => {
    await emailService.sendPasswordResetEmail(restaurantUser, resetToken);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(restaurantUser.name);
  });

  it('should mention 10-minute expiry in the email', async () => {
    await emailService.sendPasswordResetEmail(restaurantUser, resetToken);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain('10 minutes');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// sendNotificationEmail
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendNotificationEmail()', () => {
  beforeEach(() => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('should send notification email with the provided subject', async () => {
    const subject = 'Your donation was picked up';
    const message = '<p>Great news! Your donation was collected.</p>';

    const result = await emailService.sendNotificationEmail(restaurantUser, subject, message);

    const sg = require('@sendgrid/mail');
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: restaurantUser.email,
        subject
      })
    );
    expect(result.success).toBe(true);
  });

  it('should include the custom message in the email body', async () => {
    const subject = 'Test notification';
    const message = '<p>This is a custom message.</p>';

    await emailService.sendNotificationEmail(restaurantUser, subject, message);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(message);
  });

  it('should include user name in notification email', async () => {
    await emailService.sendNotificationEmail(shelterUser, 'Info', 'Some info.');

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(shelterUser.name);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// sendPasswordChangeConfirmation
// ═════════════════════════════════════════════════════════════════════════════
describe('EmailService.sendPasswordChangeConfirmation()', () => {
  beforeEach(() => {
    const sg = require('@sendgrid/mail');
    sg.send.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('should send password change confirmation email with correct subject', async () => {
    const result = await emailService.sendPasswordChangeConfirmation(restaurantUser);

    const sg = require('@sendgrid/mail');
    expect(sg.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: restaurantUser.email,
        subject: 'Password Changed - SharePlate'
      })
    );
    expect(result.success).toBe(true);
  });

  it('should include user name in confirmation email', async () => {
    await emailService.sendPasswordChangeConfirmation(restaurantUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain(restaurantUser.name);
  });

  it('should mention security warning about unrecognised change', async () => {
    await emailService.sendPasswordChangeConfirmation(restaurantUser);

    const sg = require('@sendgrid/mail');
    const sentMsg = sg.send.mock.calls[0][0];
    expect(sentMsg.html).toContain("If you didn't make this change");
  });
});
