// MSW Browser Worker for browser-based tests (Cypress, Storybook)
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create the service worker with default handlers
export const worker = setupWorker(...handlers);

// Export utilities for customization
export { handlers };
