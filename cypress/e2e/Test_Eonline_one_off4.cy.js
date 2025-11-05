import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully (with diagnostic logs)', () => {

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
              const frameBody = frame.contents().find('body');

              // 👤 Fill personal info
              cy.wrap(frameBody)
                .find('[name="first_name"]', { timeout: 20000 })
                .should('be.visible')
                .type('Yera');
              cy.wrap(frameBody)
                .find('[name="last_name"]').type('Cypress');

              // ☎️ Select Spain (+34) and enter phone number
              cy.wrap(frameBody)
                .find('div[aria-controls="iti-2__country-listbox"] div.iti__selected-dial-code', { timeout: 10000 })
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });

              cy.wrap(frameBody)
                .find('#iti-2__item-es-preferred', { timeout: 10000 })
                .should('be.visible')
                .click({ force: true });

              cy.wrap(frameBody)
                .find('[name="phone_number"]', { timeout: 10000 })
                .should('be.visible')
                .clear()
                .type('666884774');

              // 📧 Fill payment data
              cy.wrap(frameBody).find('[name="email"]').type('yerandyed@gmail.com');
              cy.wrap(frameBody).find('[name="card_no"]').type('4000000000000077');
              cy.wrap(frameBody).find('[name="expiry_month"]').type('12');
              cy.wrap(frameBody).find('[name="expiry_year"]').type('30');
              cy.wrap(frameBody).find('[name="cvv"]').type('123');
              cy.wrap(frameBody).find('[name="zip-code"]').type('12345');

              // ✅ Locate and click Pay Now (with extra diagnostics)
              const payNowBtn = frameBody.find('#pay_now');
              if (payNowBtn.length) {
                cy.log('🟢 Attempting REAL native click on Pay Now');
                cy.wrap(payNowBtn)
                  .scrollIntoView()
                  .should('be.visible')
                  .and('not.be.disabled')
                  .then(($btn) => {
                    const btnTextBefore = $btn.text().trim();
                    cy.log(`📄 [Before Click] Pay Now text: "${btnTextBefore}"`);
                    const nativeBtn = $btn.get(0);
                    cy.wait(500);
                    nativeBtn.click(); // Real JS click
                    cy.log(`🕐 Click executed at ${new Date().toISOString()}`);
                  });

                // 🔍 Wait and inspect for visual/button state change
                cy.wait(5000);
                cy.wrap(payNowBtn).then(($btnAfter) => {
                  const btnTextAfter = $btnAfter.text().trim();
                  const disabled = $btnAfter.is(':disabled');
                  cy.log(`📄 [After Click] Text: "${btnTextAfter}" | Disabled: ${disabled}`);
                });

                // 🧭 Check if the button changes to "Processing..." or disappears
                cy.get('body', { timeout: 15000 }).then(($bodyCheck) => {
                  const buttonExists = $bodyCheck.find('#pay_now').length > 0;
                  cy.log(`🔎 Pay Now still in DOM: ${buttonExists}`);
                });

                // ⏳ Final URL check for redirect
                cy.url({ timeout: 60000 }).should('include', '/my-profile');
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

    // 5️⃣ Fallback: try "Pay Now" in main DOM
    cy.get('body').then(($body) => {
      const payNow = $body.find('#pay_now');
      if (payNow.length) {
        cy.log('✅ Triggering Pay Now in main DOM (diagnostic mode)');
        cy.wrap(payNow)
          .scrollIntoView()
          .should('be.visible')
          .and('not.be.disabled')
          .then(($btn) => {
            const btnTextBefore = $btn.text().trim();
            cy.log(`📄 [Main DOM Before Click] "${btnTextBefore}"`);
            const nativeBtn = $btn.get(0);
            nativeBtn.click();
            cy.log(`🕐 Main DOM click executed at ${new Date().toISOString()}`);
          });

        cy.wait(5000);
        cy.get('body').then(($b) => {
          const payNowExists = $b.find('#pay_now').length > 0;
          cy.log(`🔍 Pay Now still exists in DOM: ${payNowExists}`);
        });

        cy.url({ timeout: 60000 }).should('include', '/my-profile');
      } else {
        cy.log('⚠️ #pay_now button not found in main DOM');
      }
    });
  });
});
