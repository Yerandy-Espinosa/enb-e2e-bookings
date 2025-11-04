import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully', () => {

    // 1️⃣ Visit the event page
    cy.viewport(1920, 1080);
    cy.visit('https://dev.exploringnotboring.com/experience/802/2/qa_test_online_oneoff');

    // 2️⃣ Accept cookies if the banner appears
    cy.get('button[data-cky-tag="accept-button"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // 3️⃣ Select ticket quantity
    cy.get('body').then(($body) => {
      const adultBtn = $body.find('#AdultSum');

      if (adultBtn.length) {
        cy.wrap(adultBtn)
          .scrollIntoView()
          .click({ force: true });
      } else {
        cy.log('⚠️ Button #AdultSum not found in DOM, skipping');
      }
    });

    // 4️⃣ Wait until the "Buy Now" button is enabled
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // 🕐 Wait for the payment form to appear (either in DOM or inside a single iframe)
    cy.document().then((doc) => {
      const formField = doc.querySelector('[name="first_name"]');
      const iframes = Array.from(doc.querySelectorAll('iframe'));

      if (formField) {
        cy.log('✅ Payment form found directly in DOM');
      } else if (iframes.length > 0) {
        cy.log(`ℹ️ Found ${iframes.length} iframes, checking for payment form...`);

        // Find the iframe that actually contains the payment form
        cy.wrap(iframes).each(($iframe) => {
          const body = $iframe.contents().find('body');
          if (body.find('[name="first_name"]').length) {
            cy.log('✅ Found payment form iframe');
            cy.wrap($iframe).then((frame) => {
              cy.wrap(frame.contents().find('body'))
                .find('[name="first_name"]', { timeout: 20000 })
                .should('be.visible')
                .type('Yera');
            });
          }
        });
      } else {
        cy.log('⚠️ No iframes detected and form not visible yet, waiting...');
        cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
      }
    });

    // 5️⃣ Fill in the payment form if visible in main DOM
    cy.get('body').then(($body) => {
      if ($body.find('[name="first_name"]').length) {
        cy.get('[name="first_name"]').type('Yera');
        cy.get('[name="last_name"]').type('Cypress');
        cy.get('#form_payment_booking div[aria-controls="iti-2__country-listbox"] div.iti__selected-dial-code').click();
        cy.get('#iti-2__item-es-preferred').click();
        cy.get('[name="phone_number"]').type('666884774');
        cy.get('[name="email"]').type('yerandyed@gmail.com');
        cy.get('[name="card_no"]').type('4000000000000077');
        cy.get('[name="expiry_month"]').type('12');
        cy.get('[name="expiry_year"]').type('30');
        cy.get('[name="cvv"]').type('123');
        cy.get('[name="zip-code"]').type('12345');
      } else {
        cy.log('⚠️ Payment form not found in main DOM — possibly handled inside iframe.');
      }
    });

    // 6️⃣ Click "Pay Now"
    cy.get('#pay_now', { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    // 7️⃣ Wait for redirect to confirmation page
    cy.url({ timeout: 30000 }).should('match', /\/(orders|my-profile|qr-code)/);
  });
});
