// MSW Server for Node.js environment (Jest tests)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create the mock server with default handlers
export const server = setupServer(...handlers);

// Export utilities for test customization
export { handlers };
