// Loaded before every spec.
import './commands';

// The public suite runs with placeholder Clerk keys (CI, local smoke runs), so
// Clerk's browser script cannot load. Ignore exactly that failure; every other
// application error (hydration, React, our code) still fails the test.
Cypress.on('uncaught:exception', err => {
  if (/clerk/i.test(err.message) && /(load|failed|publishable)/i.test(err.message)) {
    return false;
  }
  return undefined;
});
