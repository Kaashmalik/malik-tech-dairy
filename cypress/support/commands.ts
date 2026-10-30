/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Sign in through the Clerk <SignIn /> form and wait for the app redirect.
       * Uses a Clerk test user (CYPRESS_TEST_EMAIL / CYPRESS_TEST_PASSWORD).
       * @example cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'))
       */
      login(email: string, password: string): Chainable<void>;
      /** Read the JSON-LD blocks on the current page. */
      jsonLd(): Chainable<Array<Record<string, unknown>>>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    ['clerk', email],
    () => {
      cy.visit('/sign-in');
      cy.get('input[name="identifier"]', { timeout: 20000 }).should('be.visible').type(email);
      cy.contains('button', /continue/i).click();
      cy.get('input[name="password"]', { timeout: 20000 }).should('be.visible').type(password, {
        log: false,
      });
      cy.contains('button', /continue/i).click();
      // /api/auth/redirect decides the destination (dashboard, select-farm, apply…)
      cy.location('pathname', { timeout: 30000 }).should('not.include', '/sign-in');
    },
    { cacheAcrossSpecs: true }
  );
});

Cypress.Commands.add('jsonLd', () =>
  cy.get('script[type="application/ld+json"]').then($scripts => {
    const blocks: Array<Record<string, unknown>> = [];
    $scripts.each((_i, el) => {
      const parsed = JSON.parse(el.textContent || 'null');
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) if (item) blocks.push(item);
    });
    return blocks;
  })
);

export {};
