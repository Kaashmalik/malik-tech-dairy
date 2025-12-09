/// <reference types="cypress" />

describe('Critical Flow 4: Subscription Limit Hit → Upgrade Prompt', () => {
  const testEmail = Cypress.env('TEST_EMAIL') || 'test@example.com';
  const testPassword = Cypress.env('TEST_PASSWORD') || 'TestPassword123!';

  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Login
    cy.visit('/sign-in');
    cy.get('input[name="identifier"]', { timeout: 10000 }).type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
  });

  it('should show upgrade prompt when limit is reached', () => {
    // Step 1: Check current subscription and limits
    cy.visit('/dashboard/subscription');
    cy.contains(/plan|subscription/i, { timeout: 10000 }).should('be.visible');

    // Step 2: Try to add animals until limit is reached
    cy.visit('/dashboard/animals');

    // Get current animal count
    cy.get('body').then($body => {
      const animalCount = $body.find('[data-animal-tag]').length;

      // If on free plan (30 animals limit), try to add animals
      if (animalCount < 30) {
        // Add animals until we hit the limit
        for (let i = animalCount; i < 30; i++) {
          cy.get('a[href="/dashboard/animals/new"], button')
            .contains(/add|new|create/i)
            .first()
            .click({ timeout: 10000 });

          const animalTag = `COW-LIMIT-${Date.now()}-${i}`;
          const birthDate = new Date();
          birthDate.setFullYear(birthDate.getFullYear() - 2);
          const birthDateStr = birthDate.toISOString().split('T')[0];

          cy.get('input[name="tag"]', { timeout: 10000 }).type(animalTag);
          cy.get('input[name="name"]').type(`Test Cow ${i}`);
          cy.get('select[name="species"]').select('cow');
          cy.get('input[name="dateOfBirth"]').type(birthDateStr);
          cy.get('select[name="gender"]').select('female');
          cy.get('button[type="submit"]').click();

          cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');
          cy.visit('/dashboard/animals');
        }
      }
    });

    // Step 3: Try to add one more animal (should hit limit)
    cy.visit('/dashboard/animals/new');

    const animalTag = `COW-LIMIT-${Date.now()}`;
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2);
    const birthDateStr = birthDate.toISOString().split('T')[0];

    cy.get('input[name="tag"]', { timeout: 10000 }).type(animalTag);
    cy.get('input[name="name"]').type('Limit Test Cow');
    cy.get('select[name="species"]').select('cow');
    cy.get('input[name="dateOfBirth"]').type(birthDateStr);
    cy.get('select[name="gender"]').select('female');
    cy.get('button[type="submit"]').click();

    // Step 4: Verify upgrade prompt appears
    cy.contains(/limit|upgrade|plan/i, { timeout: 10000 }).should('be.visible');
    cy.contains(/upgrade|professional|enterprise/i).should('be.visible');

    // Step 5: Click upgrade button/link
    cy.get('a[href*="subscription"], button')
      .contains(/upgrade|plan/i)
      .first()
      .click();

    // Step 6: Verify redirect to subscription/checkout page
    cy.url({ timeout: 10000 }).should('satisfy', url => {
      return url.includes('/subscription') || url.includes('/checkout');
    });

    // Step 7: Verify pricing plans are displayed
    cy.contains(/starter|professional|enterprise/i, { timeout: 10000 }).should('be.visible');
  });
});
