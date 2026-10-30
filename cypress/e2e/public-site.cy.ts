/// <reference types="cypress" />

/**
 * Public site: runs without any accounts (safe for CI against a preview deploy).
 *   npm run dev            # or CYPRESS_BASE_URL=https://<preview>.vercel.app
 *   npx cypress run --spec cypress/e2e/public-site.cy.ts
 */

const TRANSLATED_GUIDE = 'heat-detection-cows-buffaloes';

describe('Public site', () => {
  describe('Marketing and navigation', () => {
    it('homepage links to free sign-up, guides and the Urdu site, without an admin link', () => {
      cy.visit('/');
      cy.get('h1').should('be.visible');
      cy.get('header a[href="/sign-up"]').should('exist');
      cy.get('header a[href="/guides"]').should('exist');
      cy.get('header a[href="/ur"]').should('exist');
      cy.get('a[href="/super-admin"]').should('not.exist');
      cy.get('link[rel="alternate"][hreflang="ur-PK"]').should('have.attr', 'href').and('include', '/ur');
    });
  });

  describe('Guides', () => {
    it('lists at least 25 guides', () => {
      cy.visit('/guides');
      cy.get('a[href^="/guides/"]').should('have.length.gte', 25);
      cy.get('link[rel="canonical"]').should('have.attr', 'href').and('match', /\/guides$/);
    });

    it('renders an article with structured data, canonical and hreflang', () => {
      cy.visit(`/guides/${TRANSLATED_GUIDE}`);
      cy.get('h1').should('contain.text', 'Heat Detection');
      cy.get('link[rel="canonical"]')
        .should('have.attr', 'href')
        .and('match', new RegExp(`/guides/${TRANSLATED_GUIDE}$`));
      cy.get('link[rel="alternate"][hreflang="ur-PK"]')
        .should('have.attr', 'href')
        .and('include', `/ur/guides/${TRANSLATED_GUIDE}`);
      cy.jsonLd().then(blocks => {
        const types = blocks.map(b => b['@type']);
        expect(types).to.include.members(['Article', 'BreadcrumbList', 'FAQPage']);
      });
      // Table of contents anchors resolve to headings
      cy.get('nav[aria-label="On this page"] a').first().then($a => {
        cy.get($a.attr('href')!).should('exist');
      });
    });

    it('returns 404 for unknown guides', () => {
      cy.request({ url: '/guides/does-not-exist', failOnStatusCode: false })
        .its('status')
        .should('eq', 404);
    });
  });

  describe('Urdu pages', () => {
    it('Urdu homepage is right-to-left and links back to English', () => {
      cy.visit('/ur');
      cy.get('[dir="rtl"][lang="ur"]').should('exist');
      cy.get('h1').invoke('text').should('match', /[؀-ۿ]/);
      cy.get('link[rel="alternate"][hreflang="en-PK"]').should('exist');
    });

    it('Urdu guide is a real translation with a language switch', () => {
      cy.visit(`/ur/guides/${TRANSLATED_GUIDE}`);
      cy.get('article[dir="rtl"]').should('exist');
      cy.get('h1').invoke('text').should('match', /[؀-ۿ]/);
      cy.get(`a[href="/guides/${TRANSLATED_GUIDE}"]`).should('contain.text', 'Read in English');
      cy.get('link[rel="canonical"]').should('have.attr', 'href').and('include', '/ur/guides/');
    });
  });

  describe('Free tools', () => {
    it('calving calculator gives the buffalo due date', () => {
      cy.visit('/tools/calving-date-calculator');
      cy.contains('label', 'Animal').find('select').select('buffalo');
      cy.contains('label', 'Breeding').find('input[type="date"]').type('2026-01-01');
      cy.contains('Expected calving date').parent().should('contain.text', '7 Nov 2026');
    });

    it('milk price calculator prices on total solids', () => {
      cy.visit('/tools/milk-price-calculator');
      // 100 L x 1.03 kg/L x (6 + 9)% = 15.45 kg TS; x Rs 1000 = Rs 15,450
      cy.contains('label', 'Milk (litres)').find('input').clear().type('100');
      cy.contains('label', 'Fat %').find('input').clear().type('6');
      cy.contains('label', 'SNF %').find('input').clear().type('9');
      cy.contains('label', 'Rate (Rs per kg TS)').find('input').type('1000');
      cy.contains('Estimated value').parent().should('contain.text', '15,450');
    });
  });

  describe('Contact form', () => {
    it('shows server validation errors and success', () => {
      cy.intercept('POST', '/api/contact', req => {
        req.reply(
          req.body.message?.length > 10
            ? { statusCode: 200, body: { success: true } }
            : { statusCode: 400, body: { success: false, error: 'Please write a short message' } }
        );
      }).as('contact');

      cy.visit('/contact');
      cy.get('form').within(() => {
        cy.get('input').first().type('Test Farmer');
        cy.get('input[type="tel"], input[placeholder*="03"]').first().type('03001234567');
        cy.get('textarea').type('Hi');
        cy.root().submit();
      });
      cy.wait('@contact');
      cy.get('[role="alert"]').should('contain.text', 'short message');

      cy.get('textarea').clear().type('We have 20 buffaloes and want a demo.');
      cy.get('form').submit();
      cy.wait('@contact');
      cy.get('form').should('not.exist');
    });

    it('rejects an empty payload at the API', () => {
      cy.request({ method: 'POST', url: '/api/contact', body: {}, failOnStatusCode: false })
        .its('status')
        .should('eq', 400);
    });
  });

  describe('Crawling files', () => {
    it('robots.txt points to the sitemap and blocks the app', () => {
      cy.request('/robots.txt').then(res => {
        expect(res.body).to.include('Sitemap:');
        expect(res.body).to.include('Disallow: /dashboard');
        expect(res.body).not.to.include('Host:');
      });
    });

    it('sitemap lists guides and Urdu pages but no auth pages', () => {
      cy.request('/sitemap.xml').then(res => {
        expect(res.body).to.include(`/guides/${TRANSLATED_GUIDE}`);
        expect(res.body).to.include(`/ur/guides/${TRANSLATED_GUIDE}`);
        expect(res.body).not.to.match(/\/sign-in|\/sign-up|\/apply</);
      });
    });

    it('ads.txt is served only when AdSense is configured', () => {
      cy.request({ url: '/ads.txt', failOnStatusCode: false }).then(res => {
        if (res.status === 200) {
          expect(res.body).to.match(/^google\.com, pub-\d+, DIRECT, f08c47fec0942fa0/);
        } else {
          expect(res.status).to.eq(404);
        }
      });
    });
  });

  describe('Privacy and indexing', () => {
    it('privacy policy discloses advertising cookies and opt-out', () => {
      cy.visit('/privacy-policy');
      cy.contains('Advertising');
      cy.get('a[href="https://adssettings.google.com"]').should('exist');
    });

    it('auth pages are noindex and never load ads', () => {
      cy.visit('/sign-in');
      cy.get('meta[name="robots"]').should('have.attr', 'content').and('include', 'noindex');
      cy.get('script[src*="adsbygoogle"]').should('not.exist');
    });
  });

  describe('Access control', () => {
    it('redirects signed-out visitors from app pages to sign-in', () => {
      for (const path of ['/dashboard', '/animals', '/milk/bulk', '/reports', '/super-admin']) {
        cy.request({ url: path, followRedirect: false, failOnStatusCode: false }).then(res => {
          expect([302, 307, 308]).to.include(res.status);
          expect(res.redirectedToUrl || res.headers.location).to.include('/sign-in');
        });
      }
    });

    it('rejects signed-out API calls', () => {
      for (const path of ['/api/animals', '/api/milk', '/api/admin/farms', '/api/tenant/export']) {
        cy.request({ url: path, failOnStatusCode: false }).its('status').should('eq', 401);
      }
    });

    it('ignores spoofed tenant headers', () => {
      cy.request({
        url: '/api/animals',
        headers: { 'x-tenant-id': 'org_someone_else', 'x-user-id': 'user_fake' },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 401);
    });
  });
});
