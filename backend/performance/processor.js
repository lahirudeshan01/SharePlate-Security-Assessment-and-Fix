'use strict';

const crypto = require('crypto');

const PASSWORD = 'PerfTest123';

function randomDigits(length) {
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += Math.floor(Math.random() * 10);
  }
  return output;
}

function buildUserPayload(userContext, _events, done) {
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  userContext.vars.userName = `Perf User ${uniqueSuffix}`;
  userContext.vars.userEmail = `perf.${uniqueSuffix}@example.com`;
  userContext.vars.userPassword = PASSWORD;
  userContext.vars.userPhone = randomDigits(10);
  userContext.vars.organizationName = `Org ${uniqueSuffix.slice(-8)}`;

  return done();
}

module.exports = {
  buildUserPayload,
};
