/**
 * Cypress E2E Tests for MTK Dairy
 */

describe('MTK Dairy E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
  });

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated users to sign-in', () => {
      cy.url().should('include', '/sign-in');
    });

    it('should allow user to sign in', () => {
      cy.visit('/sign-in');

      // Fill in sign-in form
      cy.get('[name="email"]').type('kaash0542@gmail.com');
      cy.get('[name="password"]').type('testpassword123');
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard or farm selection
      cy.url().should('not.include', '/sign-in');
    });

    it('should allow user to sign up', () => {
      cy.visit('/sign-up');

      // Fill in sign-up form
      cy.get('[name="email"]').type(`test${Date.now()}@example.com`);
      cy.get('[name="password"]').type('TestPassword123!');
      cy.get('[name="firstName"]').type('Test');
      cy.get('[name="lastName"]').type('User');
      cy.get('button[type="submit"]').click();

      // Should redirect to farm application
      cy.url().should('include', '/apply');
    });
  });

  describe('Farm Application Flow', () => {
    it('should allow user to submit farm application', () => {
      cy.visit('/apply');

      // Fill in farm application form
      cy.get('[name="farmName"]').type('Test Farm');
      cy.get('[name="farmType"]').select('dairy');
      cy.get('[name="location"]').type('Lahore, Pakistan');
      cy.get('[name="phone"]').type('03001234567');
      cy.get('[name="description"]').type('A test dairy farm');

      cy.get('button[type="submit"]').click();

      // Should show success message
      cy.contains('Application submitted successfully').should('be.visible');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      // Sign in before dashboard tests
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/sign-in');
      });
    });

    it('should display dashboard with tenant info', () => {
      cy.visit('/dashboard');

      // Check for dashboard elements
      cy.contains('Green Valley Farm').should('be.visible');
      cy.contains('Animals').should('be.visible');
      cy.contains('Milk Production').should('be.visible');
      cy.contains('Health Records').should('be.visible');
    });

    it('should display animal statistics', () => {
      cy.visit('/dashboard');

      // Check for statistics cards
      cy.get('[data-testid="total-animals"]').should('be.visible');
      cy.get('[data-testid="active-animals"]').should('be.visible');
      cy.get('[data-testid="milk-today"]').should('be.visible');
    });

    it('should navigate to animals page', () => {
      cy.visit('/dashboard');

      cy.contains('Animals').click();
      cy.url().should('include', '/animals');
    });
  });

  describe('Animals Management', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display list of animals', () => {
      cy.visit('/animals');

      // Check for animals table
      cy.get('[data-testid="animals-table"]').should('be.visible');
      cy.get('[data-testid="animal-row"]').should('have.length.greaterThan', 0);
    });

    it('should allow filtering animals', () => {
      cy.visit('/animals');

      // Filter by species
      cy.get('[data-testid="species-filter"]').select('cattle');
      cy.get('[data-testid="apply-filter"]').click();

      // Check filtered results
      cy.get('[data-testid="animal-row"]').should('have.length.greaterThan', 0);
    });

    it('should allow searching animals', () => {
      cy.visit('/animals');

      // Search for animal
      cy.get('[data-testid="search-input"]').type('TAG001');
      cy.get('[data-testid="search-button"]').click();

      // Check search results
      cy.get('[data-testid="animal-row"]').should('have.length.greaterThan', 0);
    });

    it('should open add animal modal', () => {
      cy.visit('/animals');

      cy.get('[data-testid="add-animal-button"]').click();

      // Check modal is open
      cy.get('[data-testid="add-animal-modal"]').should('be.visible');
      cy.get('[data-testid="animal-form"]').should('be.visible');
    });

    it('should create a new animal', () => {
      cy.visit('/animals');

      // Open add animal modal
      cy.get('[data-testid="add-animal-button"]').click();

      // Fill in animal form
      cy.get('[name="tag"]').type(`TAG${Date.now()}`);
      cy.get('[name="name"]').type('Test Cow');
      cy.get('[name="species"]').select('cattle');
      cy.get('[name="breed"]').type('Holstein');
      cy.get('[name="gender"]').select('female');
      cy.get('[name="status"]').select('active');
      cy.get('[name="weight"]').type('500');

      // Submit form
      cy.get('[data-testid="submit-animal"]').click();

      // Check for success message
      cy.contains('Animal created successfully').should('be.visible');

      // Verify animal appears in list
      cy.get('[data-testid="animals-table"]').should('contain', 'Test Cow');
    });
  });

  describe('Milk Logging', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display milk logs page', () => {
      cy.visit('/milk');

      cy.get('[data-testid="milk-logs-table"]').should('be.visible');
    });

    it('should allow logging milk production', () => {
      cy.visit('/milk');

      // Open add milk log modal
      cy.get('[data-testid="add-milk-log-button"]').click();

      // Fill in milk log form
      cy.get('[name="animal"]').select(0); // Select first animal
      cy.get('[name="date"]').type(new Date().toISOString().split('T')[0]);
      cy.get('[name="session"]').select('morning');
      cy.get('[name="quantity"]').type('15');

      // Submit form
      cy.get('[data-testid="submit-milk-log"]').click();

      // Check for success message
      cy.contains('Milk logged successfully').should('be.visible');
    });
  });

  describe('Health Records', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display health records page', () => {
      cy.visit('/health');

      cy.get('[data-testid="health-records-table"]').should('be.visible');
    });

    it('should allow adding health record', () => {
      cy.visit('/health');

      // Open add health record modal
      cy.get('[data-testid="add-health-record-button"]').click();

      // Fill in health record form
      cy.get('[name="animal"]').select(0);
      cy.get('[name="recordType"]').select('checkup');
      cy.get('[name="description"]').type('Regular health checkup');
      cy.get('[name="diagnosis"]').type('Healthy');

      // Submit form
      cy.get('[data-testid="submit-health-record"]').click();

      // Check for success message
      cy.contains('Health record created successfully').should('be.visible');
    });
  });

  describe('Financial Management', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display expenses page', () => {
      cy.visit('/expenses');

      cy.get('[data-testid="expenses-table"]').should('be.visible');
    });

    it('should allow adding expense', () => {
      cy.visit('/expenses');

      // Open add expense modal
      cy.get('[data-testid="add-expense-button"]').click();

      // Fill in expense form
      cy.get('[name="date"]').type(new Date().toISOString().split('T')[0]);
      cy.get('[name="category"]').select('feed');
      cy.get('[name="description"]').type('Cattle feed purchase');
      cy.get('[name="amount"]').type('5000');

      // Submit form
      cy.get('[data-testid="submit-expense"]').click();

      // Check for success message
      cy.contains('Expense created successfully').should('be.visible');
    });

    it('should display sales page', () => {
      cy.visit('/sales');

      cy.get('[data-testid="sales-table"]').should('be.visible');
    });

    it('should allow adding sale', () => {
      cy.visit('/sales');

      // Open add sale modal
      cy.get('[data-testid="add-sale-button"]').click();

      // Fill in sale form
      cy.get('[name="date"]').type(new Date().toISOString().split('T')[0]);
      cy.get('[name="type"]').select('milk');
      cy.get('[name="quantity"]').type('100');
      cy.get('[name="unit"]').type('liters');
      cy.get('[name="pricePerUnit"]').type('150');

      // Submit form
      cy.get('[data-testid="submit-sale"]').click();

      // Check for success message
      cy.contains('Sale created successfully').should('be.visible');
    });
  });

  describe('Settings', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display settings page', () => {
      cy.visit('/settings');

      cy.contains('Settings').should('be.visible');
      cy.contains('Profile').should('be.visible');
      cy.contains('Farm Settings').should('be.visible');
      cy.contains('Team Members').should('be.visible');
    });

    it('should allow updating profile', () => {
      cy.visit('/settings');

      // Click on profile tab
      cy.contains('Profile').click();

      // Update profile
      cy.get('[name="firstName"]').clear().type('Updated');
      cy.get('[data-testid="save-profile"]').click();

      // Check for success message
      cy.contains('Profile updated successfully').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });
    });

    it('should display correctly on mobile', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.visit('/dashboard');

      // Check mobile navigation
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');

      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
    });

    it('should display correctly on tablet', () => {
      cy.viewport(768, 1024); // iPad
      cy.visit('/dashboard');

      // Check tablet layout
      cy.get('[data-testid="sidebar"]').should('be.visible');
    });

    it('should display correctly on desktop', () => {
      cy.viewport(1920, 1080); // Desktop
      cy.visit('/dashboard');

      // Check desktop layout
      cy.get('[data-testid="sidebar"]').should('be.visible');
      cy.get('[data-testid="main-content"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load dashboard within 3 seconds', () => {
      cy.session('user', () => {
        cy.visit('/sign-in');
        cy.get('[name="email"]').type('kaash0542@gmail.com');
        cy.get('[name="password"]').type('testpassword123');
        cy.get('button[type="submit"]').click();
      });

      cy.visit('/dashboard', {
        onBeforeLoad: win => {
          win.performance.mark('start');
        },
      });

      cy.window().then(win => {
        win.performance.mark('end');
        const duration = win.performance.measure('dashboard-load', 'start', 'end').duration;
        expect(duration).to.be.lessThan(3000);
      });
    });

    it('should not have console errors', () => {
      cy.visit('/dashboard');

      cy.window().then(win => {
        const errors: string[] = [];
        const originalError = win.console.error;

        win.console.error = (...args) => {
          errors.push(args.join(' '));
          originalError.apply(win.console, args);
        };

        cy.window().then(() => {
          win.console.error = originalError;
          expect(errors).to.be.empty;
        });
      });
    });
  });
});
