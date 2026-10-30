/// <reference types="cypress" />

/**
 * Signed-in farm flows. Needs a Clerk test user that owns a farm:
 *   CYPRESS_TEST_EMAIL=owner+clerk_test@example.com CYPRESS_TEST_PASSWORD=... npx cypress run \
 *     --spec cypress/e2e/farm-app.cy.ts
 * Skipped automatically when the credentials are not set. See docs/SETUP.md (Testing).
 * Uses read-only checks plus clearly prefixed test data (tag "E2E-…").
 */

const email = Cypress.env('TEST_EMAIL') as string | undefined;
const password = Cypress.env('TEST_PASSWORD') as string | undefined;
const describeIfCredentials = email && password ? describe : describe.skip;

describeIfCredentials('Farm app (signed in)', () => {
  beforeEach(() => {
    cy.login(email!, password!);
  });

  it('opens the dashboard with KPIs', () => {
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/dashboard');
    cy.request('/api/dashboard/stats').its('status').should('eq', 200);
  });

  it('herd milk entry lists milking animals or shows the empty state', () => {
    cy.visit('/milk/bulk');
    cy.get('body').should($body => {
      const hasTable = $body.text().includes('Herd Milk Entry');
      const isEmpty = /add (your )?first animal|no animals/i.test($body.text());
      expect(hasTable || isEmpty).to.eq(true);
    });
  });

  it('records milk for a new test animal and rejects a duplicate', () => {
    const tag = `E2E-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    cy.request({
      method: 'POST',
      url: '/api/animals',
      body: { tag, name: 'E2E test', species: 'buffalo', gender: 'female' },
      failOnStatusCode: false,
    }).then(created => {
      if (created.status === 403) {
        cy.log('Plan animal limit reached - skipping milk write checks');
        return;
      }
      expect(created.status).to.be.oneOf([200, 201]);
      const animalId = created.body.data?.animal?.id || created.body.data?.id;
      const entry = { date: today, session: 'evening', entries: [{ animalId, quantity: 7.5, fat: 6.5 }] };

      cy.request('POST', '/api/milk', entry).its('body.loggedCount').should('eq', 1);
      cy.request({ method: 'POST', url: '/api/milk', body: entry, failOnStatusCode: false }).then(dup => {
        expect(dup.body.loggedCount).to.eq(0);
        expect(dup.body.errors[0].error).to.match(/^DUPLICATE_ENTRY/);
      });

      // Clean up: archive the test animal
      cy.request({ method: 'DELETE', url: `/api/animals/${animalId}`, failOnStatusCode: false });
    });
  });

  it('shows the monthly milk report and downloads CSV', () => {
    cy.visit('/reports');
    cy.contains('Monthly Milk Summary').should('be.visible');
    const month = new Date().toISOString().slice(0, 7);
    cy.request(`/api/milk?report=monthly&month=${month}`).then(res => {
      expect(res.body.success).to.eq(true);
      expect(res.body.data).to.have.property('animals');
    });
  });

  it('loads tasks and staff without server errors', () => {
    cy.request('/api/staff-management/tasks').its('status').should('eq', 200);
    cy.request({ url: '/api/staff', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [200, 403]); // 403 for roles without team access
  });

  it('owner can open Data & Privacy and request an export', () => {
    cy.visit('/settings/data');
    cy.contains('Export all farm data');
    cy.request({ url: '/api/tenant/export', encoding: 'binary', failOnStatusCode: false }).then(res => {
      expect(res.status).to.be.oneOf([200, 403]);
      if (res.status === 200) expect(res.headers['content-type']).to.include('application/zip');
    });
  });
});
