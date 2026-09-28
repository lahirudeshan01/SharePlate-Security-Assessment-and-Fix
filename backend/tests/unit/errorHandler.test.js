const { errorHandler } = require('../../src/middleware/errorHandler');

describe('Vulnerability 5: Information Disclosure & Error Handler - Unit Tests', () => {
  let req, res, next;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('should suppress stack trace and return generic message in production environment', () => {
    process.env.NODE_ENV = 'production';

    const error = new Error('Cast to ObjectId failed for value "invalid-id" at path "_id"');
    error.statusCode = 500;
    error.stack = 'Error: Cast to ObjectId failed...\n    at /app/node_modules/mongoose/lib/schema/objectid.js:250:11';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error'
    });

    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.stack).toBeUndefined();
    expect(responsePayload.message).not.toContain('mongoose');
    expect(responsePayload.message).not.toContain('/app/node_modules');
  });

  it('should sanitize raw error message against Reflected XSS payloads', () => {
    process.env.NODE_ENV = 'development';

    const error = new Error('<script>alert("Reflected XSS")</script>Database Error');
    error.statusCode = 400;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.message).not.toContain('<script>');
    expect(responsePayload.message).not.toContain('</script>');
    expect(responsePayload.message).toContain('Database Error');
  });

  it('should log full error stack to server console for developer diagnostics', () => {
    const error = new Error('Internal critical database connection drop');
    error.stack = 'Error: Internal critical database connection drop at db.js:12:5';

    errorHandler(error, req, res, next);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[SERVER ERROR]')
    );
  });
});
