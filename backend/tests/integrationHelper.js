const mongoose = require('mongoose');

let mongoConnected = false;

async function setupMongoDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret-key-for-testing';
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shareplate-test');
      mongoConnected = true;
      console.log('✓ MongoDB connected for integration tests');
    }
  } catch (error) {
    mongoConnected = false;
    console.warn('✗ MongoDB connection failed. Integration tests will be skipped.');
    console.warn('  To run integration tests, start MongoDB: mongod');
  }
}

async function cleanupMongoDB() {
  if (mongoConnected && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      console.log('✓ Test database cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }
}

function itIfMongo(description, testFn, timeout) {
  if (mongoConnected) {
    it(description, testFn, timeout);
  } else {
    it.skip(description, testFn, timeout);
  }
}

function describeIfMongo(description, tests) {
  if (mongoConnected) {
    describe(description, tests);
  } else {
    describe.skip(description, tests);
  }
}

module.exports = {
  setupMongoDB,
  cleanupMongoDB,
  itIfMongo,
  describeIfMongo,
  isMongoConnected: () => mongoConnected
};
