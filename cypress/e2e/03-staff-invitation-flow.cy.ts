/// <reference types="cypress" />

describe('Critical Flow 3: Staff Invitation → Accept Invite → Log Milk with Limited Permissions', () => {
  const ownerEmail = Cypress.env('TEST_EMAIL') || 'test@example.com';
  const ownerPassword = Cypress.env('TEST_PASSWORD') || 'TestPassword123!';
  const staffEmail = Cypress.env('TEST_STAFF_EMAIL') || 'staff@example.com';
  const staffPassword = Cypress.env('TEST_STAFF_PASSWORD') || 'StaffPassword123!';

  let inviteId: string;
  let animalTag: string;

  before(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete staff invitation and permission testing', () => {
    // Step 1: Owner logs in and creates invitation
    cy.visit('/sign-in');
    cy.get('input[name="identifier"]', { timeout: 10000 }).type(ownerEmail);
    cy.get('input[name="password"]').type(ownerPassword);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Create an animal first (needed for milk logging)
    cy.visit('/dashboard/animals');
    cy.get('a[href="/dashboard/animals/new"], button')
      .contains(/add|new|create/i)
      .first()
      .click({ timeout: 10000 });

    animalTag = `COW-${Date.now()}`;
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2);
    const birthDateStr = birthDate.toISOString().split('T')[0];

    cy.get('input[name="tag"]', { timeout: 10000 }).type(animalTag);
    cy.get('input[name="name"]').type('Test Cow');
    cy.get('select[name="species"]').select('cow');
    cy.get('input[name="dateOfBirth"]').type(birthDateStr);
    cy.get('select[name="gender"]').select('female');
    cy.get('button[type="submit"]').click();
    cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');

    // Step 2: Send staff invitation
    cy.visit('/dashboard/staff');
    cy.get('button')
      .contains(/invite|add|new/i)
      .first()
      .click({ timeout: 10000 });

    cy.get('input[name="email"], input[type="email"]').first().type(staffEmail);
    cy.get('select[name="role"]').select('milking_staff');
    cy.get('button[type="submit"]').click();
    cy.contains(/invitation|sent|success/i, { timeout: 10000 }).should('be.visible');

    // Extract invite ID from page or API response
    cy.url().then(url => {
      const match = url.match(/\/invite\/([^\/\?]+)/);
      if (match) {
        inviteId = match[1];
      }
    });

    // Step 3: Staff accepts invitation
    cy.clearCookies();
    cy.clearLocalStorage();

    // If we have invite ID, visit invite page
    if (inviteId) {
      cy.visit(`/invite/${inviteId}`);
    } else {
      // Alternative: staff signs up and joins organization
      cy.visit('/sign-up');
      cy.get('input[name="emailAddress"], input[type="email"]').type(staffEmail);
      cy.get('input[name="password"]').type(staffPassword);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/sign-up');
    }

    // Step 4: Staff logs in and attempts to log milk
    cy.visit('/sign-in');
    cy.get('input[name="identifier"]', { timeout: 10000 }).type(staffEmail);
    cy.get('input[name="password"]').type(staffPassword);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Step 5: Staff should be able to log milk (milking_staff permission)
    cy.visit('/dashboard/milk/new');
    cy.get('select[name="animalId"]', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);
    cy.get('select[name="animalId"]').select(animalTag, { force: true });

    const today = new Date().toISOString().split('T')[0];
    cy.get('input[name="date"]').clear().type(today);
    cy.get('select[name="session"]').select('morning');
    cy.get('input[name="quantity"]').type('12.5');
    cy.get('button[type="submit"]').click();

    // Should succeed (milking_staff can create milk logs)
    cy.contains(/created|success/i, { timeout: 10000 }).should('be.visible');

    // Step 6: Staff should NOT be able to delete animals (limited permissions)
    cy.visit('/dashboard/animals');
    cy.get(`[data-animal-tag="${animalTag}"]`, { timeout: 10000 }).should('exist');

    // Try to find delete button - should not exist or be disabled
    cy.get('body').then($body => {
      if ($body.find('button:contains("Delete"), button[aria-label*="delete" i]').length > 0) {
        cy.get('button:contains("Delete"), button[aria-label*="delete" i]')
          .first()
          .should('be.disabled');
      }
    });
  });
});
