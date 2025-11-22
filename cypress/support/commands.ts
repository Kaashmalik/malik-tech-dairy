/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with Clerk
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to wait for tenant context to load
       * @example cy.waitForTenant()
       */
      waitForTenant(): Chainable<void>;
      
      /**
       * Custom command to create an animal
       * @example cy.createAnimal({ tag: 'COW-001', species: 'cow' })
       */
      createAnimal(animalData: {
        tag: string;
        name?: string;
        species: string;
        breed?: string;
        dateOfBirth: string;
        gender: "male" | "female";
      }): Chainable<void>;
      
      /**
       * Custom command to log milk
       * @example cy.logMilk({ animalId: 'animal-123', quantity: 10 })
       */
      logMilk(milkData: {
        animalId: string;
        date?: string;
        session?: "morning" | "evening";
        quantity: number;
      }): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/sign-in");
  cy.get('input[name="identifier"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("not.include", "/sign-in");
});

Cypress.Commands.add("waitForTenant", () => {
  // Wait for tenant context to be loaded
  cy.window().its("__TENANT_ID__").should("exist");
});

Cypress.Commands.add(
  "createAnimal",
  (animalData: {
    tag: string;
    name?: string;
    species: string;
    breed?: string;
    dateOfBirth: string;
    gender: "male" | "female";
  }) => {
    cy.visit("/dashboard/animals/new");
    
    cy.get('input[name="tag"]').type(animalData.tag);
    if (animalData.name) {
      cy.get('input[name="name"]').type(animalData.name);
    }
    cy.get('select[name="species"]').select(animalData.species);
    if (animalData.breed) {
      cy.get('select[name="breed"]').select(animalData.breed);
    }
    cy.get('input[name="dateOfBirth"]').type(animalData.dateOfBirth);
    cy.get('select[name="gender"]').select(animalData.gender);
    
    cy.get('button[type="submit"]').click();
    cy.contains("Animal created successfully").should("be.visible");
  }
);

Cypress.Commands.add(
  "logMilk",
  (milkData: {
    animalId: string;
    date?: string;
    session?: "morning" | "evening";
    quantity: number;
  }) => {
    cy.visit("/dashboard/milk/new");
    
    cy.get('select[name="animalId"]').select(milkData.animalId);
    if (milkData.date) {
      cy.get('input[name="date"]').clear().type(milkData.date);
    }
    if (milkData.session) {
      cy.get('select[name="session"]').select(milkData.session);
    }
    cy.get('input[name="quantity"]').type(milkData.quantity.toString());
    
    cy.get('button[type="submit"]').click();
    cy.contains("Milk log created successfully").should("be.visible");
  }
);

export {};

