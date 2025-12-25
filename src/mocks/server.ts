// MSW Server for Node.js environment (Jest tests)
// Note: This file is conditionally loaded - tests will still work without MSW
// Placeholder exports for when MSW is not available
let server: any = null;
try {
  // Dynamic require for MSW v2 ESM compatibility
  const { setupServer } = require('msw/node');
  const { handlers } = require('./handlers');
  server = setupServer(...handlers);
} catch (error) {
}
export { server };