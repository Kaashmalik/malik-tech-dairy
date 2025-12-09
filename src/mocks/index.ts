// MSW Mocking Entry Point
// Conditionally exports server or browser worker based on environment

export { handlers } from './handlers';

// For Node.js tests
export { server } from './server';

// Note: browser.ts should be imported directly in browser environments
// to avoid bundling issues with msw/browser in Node.js
