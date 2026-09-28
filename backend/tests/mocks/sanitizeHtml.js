// CommonJS mock for sanitize-html to prevent ESM issues in Jest
function sanitizeHtml(str, options) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .trim();
}

module.exports = sanitizeHtml;
