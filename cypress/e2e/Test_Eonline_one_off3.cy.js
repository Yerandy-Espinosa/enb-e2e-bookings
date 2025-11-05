import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully', () => {

    // 1️⃣ Visit the event page
    cy.viewport(1920, 1080);
    cy.visit('https://dev.exploringnotboring.com/experience/802/2/qa_test_online_oneoff');

    // 2️⃣ Accept cookies if visible
    cy.get('button[data-cky-tag="accept-button"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // 3️⃣ Select one ticket
    cy.get('body').then(($body) => {
      const adultBtn = $body.find('#AdultSum');
      if (adultBtn.length) {
        cy.wrap(adultBtn).scrollIntoView().click({ force: true });
      } else {
        cy.log('⚠️ Button #AdultSum not found, skipping');
      }
    });

    // 4️⃣ Click "Buy Now"
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // 5️⃣ Detect and interact with the payment form (main DOM or iframe)
    cy.document({ timeout: 20000 }).then((doc) => {
      const formField = doc.querySelector('[name="first_name"]');
      const iframes = Array.from(doc.querySelectorAll('iframe'));

      if (formField) {
        cy.log('✅ Payment form found directly in DOM');
      } else if (iframes.length > 0) {
        cy.log(`ℹ️ Found ${iframes.length} iframes, scanning for payment form...`);

        // ✅ Filter only the iframe that contains the form
        const validFrame = iframes.find((f) => {
          try {
            return f.contentDocument && f.contentDocument.querySelector('[name="first_name"]');
          } catch {
            return false;
          }
        });

        if (validFrame) {
          cy.log('✅ Payment form located inside iframe');
          cy.wait(2000); // Give time for fields to render

          cy.wrap(validFrame)
            .its('contentDocument.body')
            .should('not.be.empty')
            .then(cy.wrap)
            .within(() => {
              cy.get('[name="first_name"]').type('Yera');
              cy.get('[name="last_name"]').type('Cypress');
              cy.get('[name="email"]').type('yerandyed@gmail.com');
              cy.get('[name="card_no"]').type('4000000000000077');
              cy.get('[name="expiry_month"]').type('12');
              cy.get('[name="expiry_year"]').type('30');
              cy.get('[name="cvv"]').type('123');
              cy.get('[name="zip-code"]').type('12345');

              cy.wait(1000);
              if (Cypress.$('#pay_now').length) {
                cy.get('#pay_now')
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true });
              } else {
                cy.log('⚠️ #pay_now not found inside iframe');
              }
            });
        } else {
          cy.log('⚠️ No iframe with payment form detected, fallback to main DOM');
          cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
        }
      } else {
        cy.log('⚠️ No iframe found, waiting for payment form in main DOM...');
        cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
      }
    });

    // 6️⃣ Try clicking "Pay Now" in main DOM as fallback
    cy.get('body').then(($body) => {
      if ($body.find('#pay_now').length) {
        cy.log('✅ Clicking Pay Now in main DOM');
        cy.get('#pay_now')
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      } else {
        cy.log('⚠️ #pay_now not found in main DOM');
      }
    });

    // 7️⃣ Verify success redirect or confirmation
    cy.url({ timeout: 30000 }).should('match', /\/(orders|my-profile|qr-code)/);
  });
});