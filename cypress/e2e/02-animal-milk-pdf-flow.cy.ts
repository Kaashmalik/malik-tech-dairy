/// <reference types="cypress" />

describe('Critical Flow 2: Create Animal → Log Morning Milk → Generate Daily PDF Report', () => {
  const testEmail = Cypress.env('TEST_EMAIL') || 'test@example.com';
  const testPassword = Cypress.env('TEST_PASSWORD') || 'TestPassword123!';

  let animalTag: string;
  let animalId: string;

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

  it('should complete animal creation, milk logging, and PDF generation', () => {
    // Step 1: Create an animal
    cy.visit('/dashboard/animals');
    cy.get('a[href="/dashboard/animals/new"], button')
      .contains(/add|new|create/i)
      .first()
      .click({ timeout: 10000 });

    animalTag = `COW-${Date.now()}`;
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2);
    const birthDateStr = birthDate.toISOString().split('T')[0];

    cy.get('input[name="tag"]', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="tag"]').type(animalTag);
    cy.get('input[name="name"]').type('Test Cow');
    cy.get('select[name="species"]').select('cow');
    cy.get('select[name="breed"]').select('Holstein');
    cy.get('input[name="dateOfBirth"]').type(birthDateStr);
    cy.get('select[name="gender"]').select('female');

    cy.get('button[type="submit"]').click();

    // Wait for success message or redirect
    cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');

    // Extract animal ID from URL or page
    cy.url().then(url => {
      const match = url.match(/\/animals\/([^\/]+)/);
      if (match) {
        animalId = match[1];
      }
    });

    // Step 2: Log morning milk
    cy.visit('/dashboard/milk/new');

    cy.get('select[name="animalId"]', { timeout: 10000 }).should('be.visible');
    // Wait for animals to load
    cy.wait(2000);
    cy.get('select[name="animalId"]').select(animalTag, { force: true });

    const today = new Date().toISOString().split('T')[0];
    cy.get('input[name="date"]').clear().type(today);
    cy.get('select[name="session"]').select('morning');
    cy.get('input[name="quantity"]').type('15.5');

    cy.get('button[type="submit"]').click();
    cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');

    // Step 3: Generate PDF report
    cy.visit('/dashboard');

    // Look for reports section or button
    cy.get('body').then($body => {
      if ($body.find('button:contains("Report"), a:contains("Report")').length > 0) {
        cy.get('button:contains("Report"), a:contains("Report")').first().click();
      } else {
        // Try to navigate to reports API directly
        cy.window().then(win => {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const endDate = new Date();

          cy.request({
            method: 'POST',
            url: '/api/reports/generate',
            body: {
              type: 'daily',
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
            },
            headers: {
              'Content-Type': 'application/json',
            },
          }).then(response => {
            // Verify PDF was generated (should return PDF buffer)
            expect(response.status).to.be.oneOf([200, 201]);
            expect(response.headers['content-type']).to.include('application/pdf');
          });
        });
      }
    });
  });
});
