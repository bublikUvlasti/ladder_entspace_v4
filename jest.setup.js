// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Load environment variables
require('dotenv').config({ path: '.env.test' })

// Global test timeout
jest.setTimeout(30000) 