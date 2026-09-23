/**
 * Unit Tests — emailService.js (Third-Party API: Nodemailer)
 *
 * Strategy:
 *  - Mock nodemailer so no real network calls are made.
 *  - Verify that the correct transporter config and mail options are used.
 *  - Verify graceful error handling (email failures must NOT throw).
 */

// jest.mock is hoisted before variable declarations, so all mock functions must
// be defined inline inside the factory using jest.fn(). We retrieve them
// afterward via require() so every test can inspect and reset them.
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn() })),
  createTestAccount: jest.fn(),
  getTestMessageUrl: jest.fn(),
}));

const nodemailer = require("nodemailer");
// Import AFTER mocking so the module picks up our mock
const { sendApprovalEmail, sendRejectionEmail } = require("../../src/config/emailService");

// Convenience aliases — we'll update these in beforeEach after clearAllMocks
let mockSendMail;
let mockCreateTransport;
let mockCreateTestAccount;
let mockGetTestMessageUrl;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
const approvalPayload = {
  shelterEmail: "shelter@example.com",
  shelterName: "Hope Shelter",
  foodName: "Rice",
  quantity: 10,
  donorName: "Alice Donor",
};

const rejectionPayload = {
  shelterEmail: "shelter@example.com",
  shelterName: "Hope Shelter",
  foodName: "Rice",
};

// --------------------------------------------------------------------------

describe("emailService — Third-Party API (Nodemailer)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Wire aliases to the hoisted mock functions
    mockCreateTransport = nodemailer.createTransport;
    mockCreateTestAccount = nodemailer.createTestAccount;
    mockGetTestMessageUrl = nodemailer.getTestMessageUrl;

    // Fresh sendMail mock for each test
    mockSendMail = jest.fn().mockResolvedValue({ messageId: "mock-id-001" });
    mockCreateTransport.mockImplementation(() => ({ sendMail: mockSendMail }));

    // Ethereal test account default
    mockCreateTestAccount.mockResolvedValue({
      user: "ethereal_user@ethereal.email",
      pass: "ethereal_pass",
    });

    // Preview URL default
    mockGetTestMessageUrl.mockReturnValue("https://ethereal.email/message/preview-url");

    // Default: no real credentials in env
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    delete process.env.EMAIL_SERVICE;
  });

  // ========================================================================
  // Transporter creation
  // ========================================================================
  describe("Transporter creation", () => {
    it("uses Ethereal test account when no env credentials are set", async () => {
      await sendApprovalEmail(approvalPayload);

      expect(nodemailer.createTestAccount).toHaveBeenCalledTimes(1);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.ethereal.email",
          port: 587,
          auth: {
            user: "ethereal_user@ethereal.email",
            pass: "ethereal_pass",
          },
        })
      );
    });

    it("uses real SMTP config when EMAIL_USER and EMAIL_PASS are set", async () => {
      process.env.EMAIL_USER = "real@gmail.com";
      process.env.EMAIL_PASS = "secret";
      process.env.EMAIL_SERVICE = "gmail";

      await sendApprovalEmail(approvalPayload);

      expect(nodemailer.createTestAccount).not.toHaveBeenCalled();
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: "gmail",
          auth: {
            user: "real@gmail.com",
            pass: "secret",
          },
        })
      );
    });

    it("defaults EMAIL_SERVICE to 'gmail' when not specified", async () => {
      process.env.EMAIL_USER = "real@gmail.com";
      process.env.EMAIL_PASS = "secret";
      // EMAIL_SERVICE intentionally omitted

      await sendApprovalEmail(approvalPayload);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ service: "gmail" })
      );
    });
  });

  // ========================================================================
  // sendApprovalEmail
  // ========================================================================
  describe("sendApprovalEmail", () => {
    it("calls sendMail with correct recipient, subject and HTML body", async () => {
      await sendApprovalEmail(approvalPayload);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe("shelter@example.com");
      expect(mailOptions.subject).toBe("Your Food Request Has Been Approved!");
      expect(mailOptions.html).toContain("Hope Shelter");
      expect(mailOptions.html).toContain("10 units of Rice");
      expect(mailOptions.html).toContain("Alice Donor");
      expect(mailOptions.html).toContain("approved");
    });

    it("logs the Ethereal preview URL when returned", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendApprovalEmail(approvalPayload);

      expect(mockGetTestMessageUrl).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Email preview (Ethereal):"),
        expect.stringContaining("ethereal.email")
      );

      consoleSpy.mockRestore();
    });

    it("does not log preview URL when getTestMessageUrl returns null", async () => {
      mockGetTestMessageUrl.mockReturnValueOnce(null);
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendApprovalEmail(approvalPayload);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("does NOT throw when sendMail rejects — logs error instead", async () => {
      mockSendMail.mockRejectedValueOnce(new Error("SMTP connection refused"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(sendApprovalEmail(approvalPayload)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Email send failed:",
        "SMTP connection refused"
      );

      consoleSpy.mockRestore();
    });
  });

  // ========================================================================
  // sendRejectionEmail
  // ========================================================================
  describe("sendRejectionEmail", () => {
    it("calls sendMail with correct recipient, subject and HTML body", async () => {
      await sendRejectionEmail(rejectionPayload);

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const mailOptions = mockSendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe("shelter@example.com");
      expect(mailOptions.subject).toBe("Update on Your Food Request");
      expect(mailOptions.html).toContain("Hope Shelter");
      expect(mailOptions.html).toContain("Rice");
      expect(mailOptions.html).toContain("rejected");
    });

    it("does NOT throw when sendMail rejects — logs error instead", async () => {
      mockSendMail.mockRejectedValueOnce(new Error("Timeout"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(sendRejectionEmail(rejectionPayload)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith("Email send failed:", "Timeout");

      consoleSpy.mockRestore();
    });

    it("logs the Ethereal preview URL when returned", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await sendRejectionEmail(rejectionPayload);

      expect(mockGetTestMessageUrl).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Email preview (Ethereal):"),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });
});
