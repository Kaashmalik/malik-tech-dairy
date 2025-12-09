/// <reference types="cypress" />

describe('Critical Flow 1: Clerk Login → Onboarding Wizard → Create Tenant', () => {
  const testEmail = Cypress.env('TEST_EMAIL') || 'test@example.com';
  const testPassword = Cypress.env('TEST_PASSWORD') || 'TestPassword123!';

  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete onboarding flow', () => {
    // Step 1: Login with Clerk
    cy.visit('/sign-in');

    // Wait for Clerk to load
    cy.get('input[name="identifier"]', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="identifier"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for redirect after login
    cy.url({ timeout: 15000 }).should('satisfy', url => {
      return url.includes('/onboarding') || url.includes('/dashboard');
    });

    // Step 2: Complete onboarding wizard (if redirected to onboarding)
    cy.url().then(url => {
      if (url.includes('/onboarding')) {
        // Step 1: Farm Information
        cy.get('input[name="farmName"]', { timeout: 10000 }).should('be.visible');
        cy.get('input[name="farmName"]').type('E2E Test Farm');
        cy.get('input[name="farmAddress"]').type('123 Test Street, Test City');
        cy.get('button')
          .contains(/next|continue/i)
          .click();

        // Step 2: Animal Types (if applicable)
        cy.wait(1000);
        cy.get('input[type="checkbox"]').first().check();
        cy.get('button')
          .contains(/next|continue/i)
          .click();

        // Step 3: Plan Selection (if applicable)
        cy.wait(1000);
        cy.get('button')
          .contains(/free|start|complete/i)
          .click();

        // Wait for redirect to dashboard
        cy.url({ timeout: 15000 }).should('include', '/dashboard');
      }
    });

    // Step 3: Verify tenant was created
    cy.url().should('include', '/dashboard');
    cy.contains('E2E Test Farm', { timeout: 10000 }).should('be.visible');
  });
});
