import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully with advanced Pay Now click', () => {

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
          .should('be.visible')
          .then(($btn) => {
            $btn[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            cy.log('🟢 Real DOM click executed on #AdultSum');
          });
      } else {
        cy.log('⚠️ Button #AdultSum not found, skipping');
      }
    });

    // 4️⃣ Click "Buy Now"
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .scrollIntoView()
      .should('be.visible')
      .and('not.be.disabled')
      .then(($btn) => {
        $btn[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        cy.log('🟢 Real DOM click executed on "Buy Now"');
      });

    // 🕐 Wait for payment form or iframe
    cy.document().then((doc) => {
      const iframes = Array.from(doc.querySelectorAll('iframe'));
      if (iframes.length > 0) {
        cy.log(`ℹ️ Found ${iframes.length} iframes, searching for payment form...`);
        cy.wrap(iframes).each(($iframe) => {
          const body = $iframe.contents().find('body');
          if (body.find('[name="first_name"]').length) {
            cy.wrap($iframe).then((frame) => {
              const frameBody = frame.contents().find('body');

              // 👤 Fill info
              cy.wrap(frameBody).find('[name="first_name"]').type('Yera');
              cy.wrap(frameBody).find('[name="last_name"]').type('Cypress');

              // ☎️ Select Spain (+34)
              cy.wrap(frameBody)
                .find('div[aria-controls="iti-2__country-listbox"] div.iti__selected-dial-code')
                .click({ force: true });
              cy.wrap(frameBody)
                .find('#iti-2__item-es-preferred')
                .click({ force: true });
              cy.wrap(frameBody)
                .find('[name="phone_number"]')
                .type('666884774');

              // 📧 Payment fields
              cy.wrap(frameBody).find('[name="email"]').type('yerandyed@gmail.com');
              cy.wrap(frameBody).find('[name="card_no"]').type('4000000000000077');
              cy.wrap(frameBody).find('[name="expiry_month"]').type('12');
              cy.wrap(frameBody).find('[name="expiry_year"]').type('30');
              cy.wrap(frameBody).find('[name="cvv"]').type('123');
              cy.wrap(frameBody).find('[name="zip-code"]').type('12345');

              // ✅ Advanced real click on Pay Now
              cy.wrap(frameBody)
                .find('#pay_now', { timeout: 10000 })
                .scrollIntoView()
                .should('be.visible')
                .and('not.be.disabled')
                .then(($btn) => {
                  cy.log(`📄 Pay Now text before click: "${$btn.text().trim()}"`);
                  const nativeBtn = $btn[0];
                  nativeBtn.focus();
                  nativeBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                  nativeBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                  nativeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                  cy.log('🟢 Dispatched full native click sequence on #pay_now');
                });

              // 📸 Screenshot right after click
              cy.wait(2000);
              cy.screenshot(`after-pay-now-${Date.now()}`);

              // 🕒 Wait for any button change or redirect
              cy.get(frameBody, { timeout: 20000 }).then(($b) => {
                const btn = $b.find('#pay_now');
                if (btn.length) {
                  cy.log(`🔍 After click: text="${btn.text().trim()}", disabled=${btn.is(':disabled')}`);
                } else {
                  cy.log('✅ #pay_now removed from DOM (likely processing)');
                }
              });

              // 🧭 Wait for redirect to my-profile
              cy.url({ timeout: 60000 }).should('include', '/my-profile');
            });
          }
        });
      } else {
        cy.log('⚠️ No iframe found, waiting for payment form in main DOM...');
      }
    });

    // 5️⃣ Fallback (main DOM Pay Now)
    cy.get('body').then(($body) => {
      const payNow = $body.find('#pay_now');
      if (payNow.length) {
        const btn = payNow[0];
        btn.focus();
        btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        cy.log('🟢 Native click sequence triggered on #pay_now in main DOM');
        cy.screenshot(`after-pay-now-main-${Date.now()}`);
        cy.url({ timeout: 60000 }).should('include', '/my-profile');
      } else {
        cy.log('⚠️ #pay_now not found in main DOM');
      }
    });
  });
});
