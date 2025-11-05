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
        cy.wrap(adultBtn)
          .scrollIntoView()
          .click({ force: true });
      } else {
        cy.log('⚠️ Button #AdultSum not found, skipping');
      }
    });

    // 4️⃣ Click "Buy Now"
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // 🕐 Wait for payment form or iframe
    cy.document().then((doc) => {
      const formField = doc.querySelector('[name="first_name"]');
      const iframes = Array.from(doc.querySelectorAll('iframe'));

      if (formField) {
        cy.log('✅ Payment form found directly in DOM');
      } else if (iframes.length > 0) {
        cy.log(`ℹ️ Found ${iframes.length} iframes, searching for payment form...`);

        cy.wrap(iframes).each(($iframe) => {
          const body = $iframe.contents().find('body');
          if (body.find('[name="first_name"]').length) {
            cy.log('✅ Payment form located inside iframe');
            cy.wrap($iframe).then((frame) => {
              cy.wrap(frame.contents().find('body'))
                .find('[name="first_name"]', { timeout: 20000 })
                .should('be.visible')
                .type('Yera');
              cy.wrap(frame.contents().find('body'))
                .find('[name="last_name"]').type('Cypress');
              cy.wrap(frame.contents().find('body'))
                .find('[name="email"]').type('yerandyed@gmail.com');
              cy.wrap(frame.contents().find('body'))
                .find('[name="card_no"]').type('4000000000000077');
              cy.wrap(frame.contents().find('body'))
                .find('[name="expiry_month"]').type('12');
              cy.wrap(frame.contents().find('body'))
                .find('[name="expiry_year"]').type('30');
              cy.wrap(frame.contents().find('body'))
                .find('[name="cvv"]').type('123');
              cy.wrap(frame.contents().find('body'))
                .find('[name="zip-code"]').type('12345');

              // ✅ Now click "Pay Now" inside iframe if present
              const payNowBtn = frame.contents().find('body').find('#pay_now');
              if (payNowBtn.length) {
                cy.wrap(payNowBtn)
                  .scrollIntoView()
                  .should('be.visible')
                  .click({ force: true });
              } else {
                cy.log('⚠️ #pay_now button not found inside iframe');
              }
            });
          }
        });
      } else {
        cy.log('⚠️ No iframe found, waiting for payment form in main DOM...');
        cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
      }
    });

    // 5️⃣ Try clicking "Pay Now" in main DOM as fallback
    cy.get('body').then(($body) => {
      if ($body.find('#pay_now').length) {
        cy.log('✅ Clicking Pay Now in main DOM');
        cy.get('#pay_now')
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
      } else {
        cy.log('⚠️ #pay_now button not found in main DOM');
      }
    });

    // 6️⃣ Verify success redirect
    cy.url({ timeout: 30000 }).should('match', /\/(orders|my-profile|qr-code)/);
  });
});