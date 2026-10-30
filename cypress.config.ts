import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Override with CYPRESS_BASE_URL to test a Vercel preview deployment
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    // Generous timeouts: `next dev` compiles each route on first request
    defaultCommandTimeout: 15000,
    requestTimeout: 60000,
    responseTimeout: 120000,
    pageLoadTimeout: 120000,
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
