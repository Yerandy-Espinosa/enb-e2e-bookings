import 'cypress-iframe';

describe('Guest booking and payment flow', () => {
  it('completes a booking successfully and captures Pay Now click visually', () => {

    cy.viewport(1920, 1080);
    cy.visit('https://dev.exploringnotboring.com/experience/802/2/qa_test_online_oneoff');

    cy.get('button[data-cky-tag="accept-button"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body').then(($body) => {
      const adultBtn = $body.find('#AdultSum');
      if (adultBtn.length) cy.wrap(adultBtn).scrollIntoView().click({ force: true });
    });

    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    cy.wait(2000);
    cy.screenshot('after-buy-now-click');

    cy.document().then((doc) => {
      const iframes = Array.from(doc.querySelectorAll('iframe'));
      cy.log(`Found ${iframes.length} iframe(s)`);

      if (iframes.length > 0) {
        cy.wrap(iframes).each(($iframe, idx) => {
          const body = $iframe.contents().find('body');
          if (body.find('[name="first_name"]').length) {
            cy.wrap($iframe).then((frame) => {
              const frameBody = frame.contents().find('body');

              cy.wrap(frameBody).find('[name="first_name"]').type('Yera');
              cy.wrap(frameBody).find('[name="last_name"]').type('Cypress');
              cy.wrap(frameBody).find('[name="email"]').type('yerandyed@gmail.com');
              cy.wrap(frameBody).find('[name="card_no"]').type('4000000000000077');
              cy.wrap(frameBody).find('[name="expiry_month"]').type('12');
              cy.wrap(frameBody).find('[name="expiry_year"]').type('30');
              cy.wrap(frameBody).find('[name="cvv"]').type('123');
              cy.wrap(frameBody).find('[name="zip-code"]').type('12345');

              // country code + phone
              cy.wrap(frameBody)
                .find('div[aria-controls="iti-2__country-listbox"] div.iti__selected-dial-code')
                .click({ force: true });
              cy.wrap(frameBody).find('#iti-2__item-es-preferred').click({ force: true });
              cy.wrap(frameBody).find('[name="phone_number"]').type('666884774');

              cy.screenshot(`before-paynow-iframe-${idx}`);

              cy.wrap(frameBody)
                .find('#pay_now', { timeout: 15000 })
                .should('be.visible')
                .and('not.be.disabled')
                .then(($btn) => {
                  cy.log(`🟢 Pay Now text: "${$btn.text().trim()}"`);
                  console.log('Pay Now button HTML:', $btn[0].outerHTML);

                  // Simulate human click
                  cy.wrap($btn).scrollIntoView().click({ force: true });
                });

              cy.wait(4000);
              cy.screenshot(`after-paynow-iframe-${idx}`);
            });
          }
        });
      } else {
        cy.log('⚠️ No iframe detected - waiting main DOM form');
        cy.get('[name="first_name"]', { timeout: 25000 }).should('be.visible');
      }
    });

    cy.wait(5000);
    cy.screenshot('final-state');
    cy.url({ timeout: 60000 }).should('include', '/my-profile');
  });
});
