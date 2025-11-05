import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully with native Pay Now click and screenshots', () => {

    // 1️⃣ Visit event page
    cy.viewport(1920, 1080);
    cy.visit('https://dev.exploringnotboring.com/experience/802/2/qa_test_online_oneoff');

    // 2️⃣ Accept cookies
    cy.get('button[data-cky-tag="accept-button"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // 3️⃣ Select ticket (stable)
    cy.get('body').then(($body) => {
      const adultBtn = $body.find('#AdultSum');
      if (adultBtn.length) {
        cy.wrap(adultBtn).scrollIntoView().click({ force: true });
      } else {
        cy.log('⚠️ #AdultSum not found');
      }
    });

    // 4️⃣ Click "Buy Now"
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // 5️⃣ Detect payment form
    cy.document().then((doc) => {
      const formField = doc.querySelector('[name="first_name"]');
      const iframes = Array.from(doc.querySelectorAll('iframe'));

      if (formField) {
        cy.log('✅ Payment form found directly in DOM');
      } else if (iframes.length > 0) {
        cy.log(`ℹ️ Found ${iframes.length} iframes`);

        cy.wrap(iframes).each(($iframe) => {
          const body = $iframe.contents().find('body');
          if (body.find('[name="first_name"]').length) {
            cy.wrap($iframe).then((frame) => {
              const frameBody = frame.contents().find('body');

              // 🧾 Fill the form
              cy.wrap(frameBody).find('[name="first_name"]').type('Yera');
              cy.wrap(frameBody).find('[name="last_name"]').type('Cypress');

              cy.wrap(frameBody)
                .find('div[aria-controls="iti-2__country-listbox"] div.iti__selected-dial-code')
                .click({ force: true });
              cy.wrap(frameBody)
                .find('#iti-2__item-es-preferred')
                .click({ force: true });
              cy.wrap(frameBody)
                .find('[name="phone_number"]')
                .type('666884774');

              cy.wrap(frameBody).find('[name="email"]').type('yerandyed@gmail.com');
              cy.wrap(frameBody).find('[name="card_no"]').type('4000000000000077');
              cy.wrap(frameBody).find('[name="expiry_month"]').type('12');
              cy.wrap(frameBody).find('[name="expiry_year"]').type('30');
              cy.wrap(frameBody).find('[name="cvv"]').type('123');
              cy.wrap(frameBody).find('[name="zip-code"]').type('12345');

              // 🧠 Focus: Pay Now interaction
              cy.wrap(frameBody)
                .find('#pay_now', { timeout: 20000 })
                .scrollIntoView()
                .should('be.visible')
                .and('not.be.disabled')
                .then(($btn) => {
                  const el = $btn[0];
                  cy.log('🟢 Simulating human-like click on Pay Now');
                  cy.screenshot('before-pay-now');

                  // Realistic event dispatch
                  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
                  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

                  cy.wait(4000);
                  cy.screenshot('after-pay-now');
                });

              // 🧭 Wait for redirect
              cy.url({ timeout: 60000 }).should('include', '/my-profile');
            });
          }
        });
      } else {
        cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
      }
    });

    // 6️⃣ Fallback Pay Now (main DOM)
    cy.get('body').then(($body) => {
      const payNow = $body.find('#pay_now');
      if (payNow.length) {
        const el = payNow[0];
        el.focus();
        ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(evt =>
          el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true }))
        );
        cy.wait(4000);
        cy.screenshot('after-pay-now-fallback');
        cy.url({ timeout: 60000 }).should('include', '/my-profile');
      } else {
        cy.log('⚠️ #pay_now not found in main DOM');
      }
    });
  });
});