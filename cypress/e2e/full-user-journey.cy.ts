/// <reference types="cypress" />

describe('Full User Journey: Login → Onboarding → Create Animal → Log Milk → Generate PDF', () => {
  const testEmail = Cypress.env('TEST_EMAIL') || 'test@example.com';
  const testPassword = Cypress.env('TEST_PASSWORD') || 'TestPassword123!';

  let animalId: string;
  let animalTag: string;

  before(() => {
    // Ensure we start from a clean state
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete the full user journey', () => {
    // Step 1: Login
    cy.visit('/sign-in');
    cy.get('input[name="identifier"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();

    // Wait for redirect after login
    cy.url().should('not.include', '/sign-in', { timeout: 10000 });

    // Step 2: Complete onboarding (if needed)
    cy.url().then(url => {
      if (url.includes('/onboarding')) {
        // Fill onboarding form
        cy.get('input[name="farmName"]').type('Test Farm');
        cy.get('input[name="farmAddress"]').type('123 Test Street');
        cy.get('button[type="submit"]').click();

        // Wait for redirect to dashboard
        cy.url().should('include', '/dashboard', { timeout: 10000 });
      }
    });

    // Step 3: Navigate to animals page and create an animal
    cy.visit('/dashboard/animals');
    cy.get('a[href="/dashboard/animals/new"]').click();

    animalTag = `COW-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2);
    const birthDateStr = birthDate.toISOString().split('T')[0];

    cy.get('input[name="tag"]').type(animalTag);
    cy.get('input[name="name"]').type('Test Cow');
    cy.get('select[name="species"]').select('cow');
    cy.get('select[name="breed"]').select('Holstein');
    cy.get('input[name="dateOfBirth"]').type(birthDateStr);
    cy.get('select[name="gender"]').select('female');

    cy.get('button[type="submit"]').click();
    cy.contains('Animal created successfully', { timeout: 10000 }).should('be.visible');

    // Extract animal ID from the URL or page
    cy.url().should('include', '/dashboard/animals');

    // Get the animal ID from the animals list
    cy.get(`[data-animal-tag="${animalTag}"]`).then($el => {
      animalId = $el.attr('data-animal-id') || '';
    });

    // Step 4: Log milk production
    cy.visit('/dashboard/milk/new');

    // Wait for animals to load
    cy.get('select[name="animalId"]', { timeout: 10000 }).should('be.visible');
    cy.get('select[name="animalId"]').select(animalTag);
    cy.get('input[name="date"]').clear().type(today);
    cy.get('select[name="session"]').select('morning');
    cy.get('input[name="quantity"]').type('15.5');

    cy.get('button[type="submit"]').click();
    cy.contains('Milk log created successfully', { timeout: 10000 }).should('be.visible');

    // Step 5: Generate PDF report
    cy.visit('/dashboard');

    // Navigate to reports (assuming there's a reports section or button)
    // This might need adjustment based on your actual UI
    cy.get('button')
      .contains(/report|download/i)
      .first()
      .click();

    // Or if there's a dedicated reports page
    cy.visit('/dashboard/reports').then(() => {
      // Select report type and date range
      cy.get('select[name="type"]').select('daily');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      cy.get('input[name="startDate"]').type(startDate.toISOString().split('T')[0]);
      cy.get('input[name="endDate"]').type(endDate.toISOString().split('T')[0]);

      cy.get('button')
        .contains(/generate|download/i)
        .click();

      // Verify PDF download started
      cy.wait(5000); // Wait for PDF generation

      // Check that a download was triggered (browser behavior)
      // Note: Actual file download verification may require additional setup
    });
  });

  after(() => {
    // Cleanup: Delete test data if needed
    // This would typically be done via API calls
  });
});
