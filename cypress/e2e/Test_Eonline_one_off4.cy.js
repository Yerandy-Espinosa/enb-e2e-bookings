describe('Guest booking and payment flow', () => {
  it('completes a booking successfully', () => {

    // 1️⃣ Visita el evento
    cy.viewport(1920, 1080);
    cy.visit('https://dev.exploringnotboring.com/experience/802/2/qa_test_online_oneoff');

    // 2️⃣ Acepta cookies si aparecen
    cy.get('button[data-cky-tag="accept-button"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true });

    // 3️⃣ Selecciona cantidad
    // Espera a que el DOM y los botones estén listos
    cy.wait(4000); // más tiempo para entornos remotos

    // Asegúrate de que el campo base esté visible y activo antes del botón
    cy.get('#AdultSum', { timeout: 15000 }).should('exist').and('be.visible');

    // Ahora valida y fuerza el click sobre el botón InfantSum
    cy.get('#InfantSum', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .then(($btn) => {
        if ($btn.is(':disabled')) {
          cy.log('Button still disabled, forcing click');
          cy.wrap($btn).click({ force: true });
        } else {
          cy.wrap($btn).click();
        }
      });

    // 4️⃣ Espera a que se habilite el botón "Buy Now"
    cy.get('#bookeventCalendar button.common-btn-buy-now', { timeout: 20000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });

    // 5️⃣ Completa el formulario
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

    // 6️⃣ Click en pagar
    cy.get('#pay_now', { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    // 7️⃣ Espera confirmación / redirección a "My Profile" o QR
    cy.url({ timeout: 30000 }).should('match', /\/(orders|my-profile)/);
  });
});
